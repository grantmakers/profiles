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
import * as retryAxios from 'retry-axios';
import axios from 'axios';
import ActionBar from './components/ActionBar';
import SavedProfilesList from './components/SavedProfilesList';
import Insights from './components/Insights';
import bugsnagClient from './utils/bugsnag.js';
import M from 'materialize';

// Retry Axios
const interceptorId = retryAxios.attach(); // eslint-disable-line no-unused-vars

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
        // TODO When would this be reached?
        // TODO If can figure out, might be source of intermittent login error
        this.stitchClientObj = Stitch.defaultAppClient;
        this.handleError('Stitch', 'stitchSetClient', 'Stitch client already available - should not occur', 'info');
      }
      return this.stitchClientObj;
    },

    stitchLogin: function() {
      // Troubleshooting
      const preLoginUser = localStorage.getItem('__stitch.client.insights-xavlz.auth_info');
      let preLoginUserId;
      if (preLoginUser !== null) {
        preLoginUserId = JSON.parse(preLoginUser).user_id;
      }
      if (this.stitchClientObj !== Stitch.getAppClient(stitchAppId) || this.stitchClientObj !== Stitch.defaultAppClient) {
        this.stitchClientObj = Stitch.getAppClient(stitchAppId);
        this.handleError('Stitch', 'stitchLogin', 'Clients do not match', 'info');
      }
      // End troubleshooting
      return this.stitchClientObj.auth.loginWithCredential(new AnonymousCredential())
        .then(result => {
          // Troubleshooting
          let postLoginUserId = result.id;
          if (preLoginUser !== null && preLoginUserId !== postLoginUserId) {
            this.handleError('Stitch', 'stitchLogin', 'UserIDs do not match', 'warning');
          }
          // End troubleshooting
          return result;
        })
        .catch(err => {
          this.handleError('Stitch', 'stitchLogin', err, 'warning');
        });
    },

    stitchGetInsights: function() {
      const webhook = 'https://webhooks.mongodb-stitch.com/api/client/v2.0/app/insights-xavlz/service/public/incoming_webhook/insights';
      return axios.get(webhook, {
        params: {
          ein: this.org.ein,
        },
      })
        .then(result => {
          this.insights = result.data;
        })
        .catch(err => {
          this.handleError('Stitch', 'stitchGetInsights', err, 'warning');
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
          // this.handleError('Stitch', 'stitchGetUserData', err, 'warning');
          // Send additional info to bugsnag for troubleshooting
          bugsnagClient.notify(new Error('Stitch stitchGetUserData - ' + err), {
            metaData: {
              'stitch': 'stitchGetUserData',
              'stitchUserId': userId, // For troubleshooting purposes
              'stitchClientVueProp': this.stitchClientObj, // For troubleshooting purposes
              'stitchClientDefault': Stitch.defaultAppClient, // For troubleshooting purposes
              'stitchClientGetClient': Stitch.getAppClient(stitchAppId), // For troubleshooting purposes
            },
            severity: 'warning',
          });
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
  },
};
</script>
