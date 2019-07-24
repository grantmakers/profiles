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
    <EnativModal
      ref="enativ"
    />
  </div>
</template>

<script>
import { Stitch, AnonymousCredential } from 'mongodb-stitch-browser-core';
import * as rax from 'retry-axios';
import axios from 'axios';
import ActionBar from './components/ActionBar';
import SavedProfilesList from './components/SavedProfilesList';
import Insights from './components/Insights';
import EnativModal from './components/EnativModal';
import bugsnagClient from './utils/bugsnag.js';
import M from 'materialize';

// Retry Axios
const interceptorId = rax.attach(); // eslint-disable-line no-unused-vars

// Component variables
const stitchAppId = 'insights-xavlz';

// Allow access to Bugsnag outside of Vue;
// window.bugsnag = bugsnagClient;

export default {
  components: {
    ActionBar,
    SavedProfilesList,
    Insights,
    EnativModal,
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
    this.initializeStitchAndLogin();
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
        await this.stitchLogin(0);
        // This guard ensures a user is authenticated in *most* scenarios.
        // Edge cases (e.g. 90 day auto-delete) need to be handled in subsequent Stitch function calls
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
        return this.stitchClientObj;
      } else {
        this.stitchClientObj = Stitch.defaultAppClient;
        this.handleError('Stitch', 'stitchSetClient', 'Stitch client already available - should not occur', 'info');
        return this.stitchClientObj;
      }
    },

    stitchLogin: async function(count) {
      let retryCount = count;
      const start = Date.now();
      try {
        await this.stitchClientObj.auth.loginWithCredential(new AnonymousCredential());
        return this.trackStitchLogin(start, Date.now(), 'Success');
      } catch (err) {
        if (retryCount < 1) {
          retryCount++;
          this.trackStitchLogin(start, Date.now(), 'Retry');
          return await this.stitchLogin(retryCount);
        } else {
          this.handleError('Stitch', 'stitchLogin', err, 'warning');
          return this.trackStitchLogin(start, Date.now(), 'Fail');
        }
      }
    },

    stitchGetInsights: function() {
      const start = Date.now();
      const webhook = 'https://webhooks.mongodb-stitch.com/api/client/v2.0/app/insights-xavlz/service/public/incoming_webhook/insights';
      return axios.get(webhook, {
        timeout: 4000,
        crossdomain: true,
        params: {
          ein: this.org.ein,
        },
        raxConfig: {
          retry: 1,
          noResponseRetries: 1,
          statusCodesToRetry: [[100, 199], [500, 599]],
        },
      })
        .then(result => {
          this.insights = result.data;
          this.trackWebhooks(start, Date.now(), 'Success');
        })
        .then(() => {
          // TODO Limit to desktop only
          this.matchHeight();
        })
        .catch(err => {
          this.trackWebhooks(start, Date.now(), 'Fail');
          // Send additional info to bugsnag for troubleshooting
          this.transformAxiosErrorResult(err, start);
        });
    },

    stitchGetUserData: function(count) {
      let retryCount = count;
      const start = Date.now();
      return this.stitchClientObj.callFunction('getUserData', [])
        .then(result => {
          this.trackStitchAuth(start, Date.now(), 'Success');
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
        .catch( async(err) => {
          if (retryCount < 1) {
            retryCount++;
            // Handles scenario where Stitch auto-deleted users after 90 days
            if (err.errorCodeName === 'InvalidSession') {
              this.trackStitchAuth(start, Date.now(), 'Retry');
              await this.stitchLogin();
              this.stitchGetUserData(retryCount);
            } else {
              this.stitchGetUserData(retryCount);
            }
          } else {
            this.trackStitchAuth(start, Date.now(), 'Fail');
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

    matchHeight: function() {
      if (window.$ && $.fn.matchHeight ) {
        $.fn.matchHeight._update();
      }
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

    showEnativModal: function() {
      const el = this.$refs.enativ.$refs.modal;
      const options = {
        'dismissible': false,
        'opacity': 0.85,
      };
      const instance = M.Modal.init(el, options);
      instance.open();
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
          this.showEnativModal();
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
      let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
      let gaCount = 0;

      if (typeof gaCheck === 'function' && gaCount === 0) {
        ga('send', 'event', {
          'eventCategory': 'Profile Events',
          'eventAction': 'Insight Webhooks',
          'eventLabel': 'Webhook ' + outcome,
          'eventValue': finish - start,
        });
      }

      gaCount++;
    },

    trackStitchAuth: function(start, finish, outcome) {
      let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
      let gaCount = 0;

      if (typeof gaCheck === 'function' && gaCount === 0) {
        ga('send', 'event', {
          'eventCategory': 'Profile Events',
          'eventAction': 'Stitch Auth',
          'eventLabel': 'Stitch Auth ' + outcome,
          'eventValue': finish - start,
        });
      }

      gaCount++;
    },

    trackStitchLogin: function(start, finish, outcome) {
      let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
      let gaCount = 0;

      if (typeof gaCheck === 'function' && gaCount === 0) {
        ga('send', 'event', {
          'eventCategory': 'Profile Events',
          'eventAction': 'Stitch Login',
          'eventLabel': 'Stitch Login ' + outcome,
          'eventValue': finish - start,
        });
      }

      gaCount++;
    },
  },
};
</script>
