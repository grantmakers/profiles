<template>
  <div id="app">
    <!-- eslint-disable vue/attribute-hyphenation -->
    <ActionBar
      :org="org"
      :profiles="profiles"
      :stitchClientObj="stitchClientObj"
      @updateAdd="updateProfilesListAdd"
      @updateRemove="updateProfilesListRemove"
    />
    <!-- eslint-enable vue/attribute-hyphenation -->
    <SavedProfilesList
      :profiles="profiles"
    />
    <Insights
      :insights="insights"
    />
  </div>
</template>

<script>
import { Stitch, AnonymousCredential } from 'mongodb-stitch-browser-core';
// import * as retryAxios from 'retry-axios';
import axios from 'axios';
import ActionBar from './components/ActionBar';
import SavedProfilesList from './components/SavedProfilesList';
import Insights from './components/Insights';
import bugsnagClient from './utils/bugsnag.js';
import M from 'materialize';

// Retry Axios
// const interceptorId = retryAxios.attach(); // eslint-disable-line no-unused-vars

// Component variables
const stitchAppId = 'insights-xavlz';

export default {
  components: {
    ActionBar,
    SavedProfilesList,
    Insights,
  },

  data: function() {
    return {
      profiles: [],
      org: this.getCurrentOrgData(),
      stitchClientObj: {},
      insights: [],
    };
  },

  created: function() {
    // Fetch public data
    this.stitchGetInsights();

    // Fetch private data
    // this.initializeStitchAndLogin();
  },

  mounted: function() {
    // Initialize Materialize components
    const el = document.getElementById('modal-saved-profiles');
    M.Modal.init(el);

    const elems = document.querySelectorAll('.v-tooltipped');
    M.Tooltip.init(elems);
  },

  methods: {
    initializeStitchAndLogin: async function() {
      try {
        await this.stitchSetClient();
        await this.stitchLogin();
        if (this.stitchClientObj.auth.isLoggedIn && this.stitchClientObj.auth.user !== undefined) {
          this.stitchGetUserData(0);
        }
      } catch (err) {
        this.handleError('Stitch', 'initializeStitchAndLogin', err, 'warning');
        /*
        M.toast({
          'html': 'Something went wrong while checking for updates. Try refreshing the page.',
        });
        */
      }
    },

    stitchSetClient: function() {
      if (!Stitch.hasAppClient(stitchAppId)) {
        this.stitchClientObj = Stitch.initializeDefaultAppClient(stitchAppId);
      } else {
        this.stitchClientObj = Stitch.defaultAppClient;
        this.handleError('Stitch', 'stitchSetClient', 'Stitch client already available - should not occur', 'info');
      }
      return this.stitchClientObj;
    },

    stitchLogin: function() {
      return this.stitchClientObj.auth.loginWithCredential(new AnonymousCredential())
        .catch(err => {
          this.handleError('Stitch', 'stitchLogin', err, 'warning');
        });
    },

    stitchGetInsights: function() {
      const webhook = 'https://webhooks.mongodb-stitch.com/api/client/v2.0/app/insights-xavlz/service/public/incoming_webhook/insights';
      const start = Date.now();
      return axios.get(webhook, {
        timeout: 4000,
        params: {
          ein: this.org.ein,
        },
      })
        .then(result => {
          this.insights = result.data;
          this.trackWebhooks(start, Date.now(), 'Success');
        })
        .catch(err => {
          this.trackWebhooks(start, Date.now(), 'Fail');
          // Send additional info to bugsnag for troubleshooting
          this.transformAxiosErrorResult(err, start);
        });
    },

    stitchGetUserData: function(count) {
      let retryCount = count;
      return this.stitchClientObj.callFunction('getUserData', [])
        .then(result => {
          if (result) {
            this.profiles = result.profiles.sort(function(a, b) {
              // Descending - last saved appears first
              if (a.saved_on < b.saved_on) {
                return 1;
              }
              if (a.saved_on > b.saved_on) {
                return -1;
              }
              return 0;
            });
          }
        })
        .catch(err => {
          if (retryCount < 1) {
            retryCount++;
            this.stitchGetUserData(retryCount);
          } else {
            this.handleError('Stitch', 'stitchGetUserData retry', err, 'warning');
          }
        });
    },

    getCurrentOrgData: function() {
      const data = document.getElementById('org-data');
      const obj = {};
      obj.ein = data.dataset.ein;
      obj.name = data.dataset.name;
      obj.tax_year = data.dataset.taxYear;
      obj.url = data.dataset.url;
      return obj;
    },

    updateProfilesListAdd: function(data) {
      this.profiles.unshift(data);
    },

    updateProfilesListRemove: function(ein) {
      let before = this.profiles;
      let after = before.filter( function(a) {
        return a.ein !== ein;
      });
      this.profiles = after;
    },

    handleError: function(context, fname, err, priority) {
      let obj = {};
      obj.metaData = {};
      obj.metaData[context] = fname;
      obj.severity = priority;
      return bugsnagClient.notify(new Error(context + ' ' + fname + ' - ' + err), obj);
    },

    transformAxiosErrorResult: function(err, start) {
      let troubleshoot = {};
      troubleshoot.sendBugsnagReport = true;

      // Capture ECONNABORTED, ECONNRESET, ECONNREFUSED, and ???
      if (err.code) {
        troubleshoot.code = err.code;
      }

      // Handle everything else
      // https://github.com/axios/axios#handling-errors
      if (err.response) {
        troubleshoot.data = err.response.data;
        troubleshoot.status = err.response.status;
        troubleshoot.headers = err.response.headers;
        troubleshoot.explanation = 'The request was made and the server responded with a status code that falls out of the range of 2xx';
        
        // Capture Enativ software - no need to report to Bugsnag
        if (err.response.status && err.response.status === 429) {
          troubleshoot.sendBugsnagReport = false;
          return;
        }
      } else if (err.request) {
        troubleshoot.request = err.request;
        troubleshoot.explanation = 'The request was made but no response was received. `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js';
      } else {
        troubleshoot.message = err.message;
        troubleshoot.explanation = 'Something happened in setting up the request that triggered an Error';
      }
      troubleshoot.config = err.config;

      if (troubleshoot.sendBugsnagReport === true) {
        this.trackWebhooks(start, Date.now(), 'Fail');
        bugsnagClient.notify(new Error('Stitch stitchGetInsights - ' + err), {
          metaData: {
            'stitch': 'stitchGetInsights',
            'duration': Date.now() - start,
            'axiosSummary': troubleshoot,
          },
          severity: 'warning',
        });
      }
    },

    trackWebhooks: function(start, finish, outcome) {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Insight Webhooks',
        'eventLabel': 'Webhook ' + outcome,
        'eventValue': finish - start,
      });
    },
  },
};
</script>
