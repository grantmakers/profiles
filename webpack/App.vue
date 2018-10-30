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
    initializeStitchAndLogin: function() {
      Stitch.initializeDefaultAppClient('insights-xavlz');

      const client = Stitch.defaultAppClient;
      return client.auth.loginWithCredential(new AnonymousCredential())
        .then(() => {
          this.stitchClientObj = client; // TODO Can remove if not storing client object in Vue data
          return client;
        })
        .then(clientObj => {
          this.getInsightsFromStitch(clientObj, 0);
          this.getUserDataFromStitch(clientObj, 0);
        })
        .catch(error => {
          console.log('Error connecting to Stitch');
          // TODO Not reliable as toasts may not yet be initialized - occurs in mounted
          M.toast({
            'html': 'Something went wrong. Try refreshing the page.',
          });
        });
    },

    getInsightsFromStitch: function(clientObj, count) {
      let retryCount = count;
      // Stitch functions return a promise
      clientObj.callFunction('getInsights', [this.org.ein])
        .then(result => {
          console.log('Result from getInsights');
          console.log(result);
          this.insights = result;
        })
        .catch(error => {
          // TODO DRY-up retry attempts
          console.log('Error calling getInsights function');
          if (retryCount < 2) {
            console.log('Retrying getInsightsFromStitch');
            this.getInsightsFromStitch(clientObj, retryCount++);
          } else {
            throw new Error('getInsightsFromStitch failed after retry');
          }
        });
    },

    getUserDataFromStitch: function(clientObj, count) {
      let retryCount = count;
      clientObj.callFunction('getUserData', [])
        .then(result => {
          console.log('Result from getUserData');
          console.log(result);
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
          console.log('Error calling getUserData function');
          if (retryCount < 2) {
            console.log('Retrying getUserDataFromStitch');
            this.getUserDataFromStitch(clientObj, retryCount++);
          } else {
            throw new Error('getUserDataFromStitch failed after retry');
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
