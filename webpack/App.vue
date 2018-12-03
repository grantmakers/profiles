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
    } catch (error) {
      bugsnagClient.notify(new Error('Stitch error - ' + error), {
        metaData: {'stitch': 'stitchInit beforeCreate'},
      });
    }
  },

  created: function() {
    // Initialize Stitch
    if (navigator.cookieEnabled) {
      this.initializeStitchAndLogin();
    } else {
      bugsnagClient.notify(new Error('Vue - Cookies disabled - '), {
        metaData: {'vue': 'cookies disabled'},
        severity: 'info',
      });
      M.toast({
        'html': 'Enable cookies to view available profile updates',
      });
    }
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
        if (this.stitchClientObj.auth.isLoggedIn) {
          this.stitchGetInsights(0);
          this.stitchGetUserData(0);
        }
      } catch (error) {
        bugsnagClient.notify(new Error('Stitch error - ' + error), {
          metaData: {'stitch': 'initializeStitchAndLogin'},
        });
        M.toast({
          'html': 'Something went wrong while checking for updates. Try refreshing the page.',
        });
      }
    },

    stitchSetClient: async function() {
      if (!Stitch.hasAppClient(stitchAppId)) {
        // This should never be called as Stitch.init... occurs in the beforeCreate lifecycle hook
        this.stitchClientObj = await Stitch.initializeDefaultAppClient(stitchAppId);
        bugsnagClient.notify(new Error('Stitch error - Second attempt at Stitch.init required - beforeCreate failed'), {
          metaData: {'stitch': 'stitchInit beforeCreate'},
        });
        return this.stitchClientObj;
      } else {
        this.stitchClientObj = await Stitch.defaultAppClient;
        return this.stitchClientObj;
      }
    },

    stitchLogin: function() {
      if (!this.stitchClientObj.auth.isLoggedIn) {
        const credential = new AnonymousCredential();
        return this.stitchClientObj.auth.loginWithCredential(credential)
          .catch(error => {
            bugsnagClient.notify(new Error('Stitch Login - ' + error), {
              metaData: {'stitch': 'stitchLogin'},
            });
          });
      } else {
        return true;
      }
    },

    stitchGetInsights: function(count) {
      let retryCount = count;
      return this.stitchClientObj.callFunction('getInsights', [this.org.ein])
        .then(result => {
          this.insights = result;
        })
        .catch(error => {
          // TODO DRY-up retry attempts
          bugsnagClient.notify(new Error('Stitch getInsights - ' + error), {
            metaData: {'stitch': 'stitchGetInsights'},
          });
          if (retryCount < 1) {
            retryCount++;
            this.stitchGetInsights(retryCount);
          } else {
            bugsnagClient.notify(new Error('Stitch getInsights retry - ' + error), {
              metaData: {'stitch': 'stitchGetInsights retry'},
            });
          }
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
        .catch(error => {
          // TODO DRY-up retry attempts
          bugsnagClient.notify(new Error('Stitch getUserData - ' + error), {
            metaData: {'stitch': 'stitchGetUserData'},
          });
          if (retryCount < 1) {
            retryCount++;
            this.stitchGetUserData(retryCount);
          } else {
            bugsnagClient.notify(new Error('Stitch getUserData retry - ' + error), {
              metaData: {'stitch': 'stitchGetUserData retry'},
            });
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
  },
};
</script>
