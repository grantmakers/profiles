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
      client.auth.loginWithCredential(new AnonymousCredential())
        .then(user => {
          console.log(`logged in anonymously as user ${user.id} || Next timout ${user.auth.accessTokenRefresher.nextTimeout}`);
          console.log(user);
          return user;
        })
        .then(user => {
          console.log(`nested user nextTimeout: ${user.auth.accessTokenRefresher.nextTimeout}`);
          this.stitchClientObj = client;
          return client;
        })
        .then(() => {
          console.log('Calling getInsightsFromStitch');
          console.log(`nested user nextTimeout(2): ${this.stitchClientObj.auth.accessTokenRefresher.nextTimeout}`);
          console.log(`nested user (via client) nextTimeout(2): ${client.auth.accessTokenRefresher.nextTimeout}`);
          // TODO Shouldn't need to protect this using an if statment(?) e.g.
          // if (this.sitchClientOjb...nextTimeout > 0)
          return this.getInsightsFromStitch();
        })
        .then(() => {
          console.log('Calling getUserDataFromStitch');
          console.log(`nested user nextTimeout(3): ${this.stitchClientObj.auth.accessTokenRefresher.nextTimeout}`);
          console.log(`nested user (via client) nextTimeout(3): ${client.auth.accessTokenRefresher.nextTimeout}`);
          return this.getUserDataFromStitch();
        })
        .catch(error => {
          console.log('Error connecting to Stitch');
          console.log(error);
          // TODO Not reliable as toasts may not yet be initialized - occurs in mounted
          M.toast({
            'html': 'Something went wrong. Try refreshing the page.',
          });
        });
    },

    getUserDataFromStitch: function() {
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
          console.log('Error from calling getUserData function');
          console.log(error);
        });
    },

    getInsightsFromStitch: function() {
      return this.stitchClientObj.callFunction('getInsights', [this.org.ein])
        .then(result => {
          this.insights = result;
        })
        .catch(error => {
          console.log('Error from calling getInsights function');
          console.log(error);
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
