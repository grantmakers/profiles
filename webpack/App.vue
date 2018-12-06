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
import ActionBar from './components/ActionBar';
import SavedProfilesList from './components/SavedProfilesList';
import Insights from './components/Insights';
import bugsnagClient from './utils/bugsnag.js';
import M from 'materialize';

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

  beforeCreate: function() {
    try {
      Stitch.initializeDefaultAppClient(stitchAppId);
    } catch (err) {
      bugsnagClient.notify(new Error('Stitch error - ' + err), {
        metaData: {'stitch': 'stitchInit beforeCreate'},
      });
    }
  },

  created: function() {
    // Initialize Stitch
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
        // if (this.stitchClientObj.auth.isLoggedIn) {
        if (Stitch.defaultAppClient.auth.isLoggedIn) {
          this.stitchGetInsights(0);
          this.stitchGetUserData(0);
        }
      } catch (err) {
        this.handleError('Stitch', 'initializeStitchAndLogin', err, 'warning');
        M.toast({
          'html': 'Something went wrong while checking for updates. Try refreshing the page.',
        });
      }
    },

    stitchSetClient: async function() {
      if (!Stitch.hasAppClient(stitchAppId)) {
        // This should never be called as Stitch.init... occurs in the beforeCreate lifecycle hook
        // this.stitchClientObj = await Stitch.initializeDefaultAppClient(stitchAppId);
        let client = await Stitch.initializeDefaultAppClient(stitchAppId);
        this.handleError('Vue', 'stitchSetClient', 'beforeCreate failed - should never happen', 'warning');
        // return this.stitchClientObj;
        return client;
      } else {
        // this.stitchClientObj = await Stitch.defaultAppClient;
        return Stitch.defaultAppClient;
      }
    },

    stitchLogin: async function() {
      const credential = new AnonymousCredential();
      // if (!this.stitchClientObj.auth.isLoggedIn || this.stitchClientObj.auth.user === undefined) {
      if (!Stitch.defaultAppClient.auth.isLoggedIn) {
        // return await this.stitchClientObj.auth.loginWithCredential(credential)
        return await Stitch.defaultAppClient.auth.loginWithCredential(credential)
          .then(user => {
            return user;
          })
          .catch(err => {
            this.handleError('Stitch', 'stitchLogin', err, 'warning');
          });
      } else {
        return true;
      }
    },

    stitchGetInsights: function(count) {
      let retryCount = count;
      // return this.stitchClientObj.callFunction('getInsights', [this.org.ein])
      return Stitch.defaultAppClient.callFunction('getInsights', [this.org.ein])
        .then(result => {
          this.insights = result;
        })
        .catch(err => {
          this.handleError('Stitch', 'stitchGetInsights', err, 'warning');
          if (retryCount < 1) {
            retryCount++;
            this.stitchGetInsights(retryCount);
          } else {
            this.handleError('Stitch', 'stitchGetInsights retry', err, 'warning');
          }
        });
    },

    stitchGetUserData: function(count) {
      let retryCount = count;
      // return this.stitchClientObj.callFunction('getUserData', [])
      return Stitch.defaultAppClient.callFunction('getUserData', [])
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
          this.handleError('Stitch', 'stitchGetUserData', err, 'warning');
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
