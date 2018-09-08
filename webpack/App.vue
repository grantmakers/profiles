<template>
  <div id="app">
    <ActionBar
      :org="org"
      :profiles="profiles"
      @update="updateProfilesList"
    />
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
      profiles: this.getListFromLocalStorage(),
      org: this.getCurrentOrgData(),
      stitchClientObj: {},
      stitchUserObj: {},
      insights: [],
      userData: {},
    };
  },

  mounted: function() {
    // Initialize Materialize components modal
    const el = document.getElementById('modal-saved-profiles');
    M.Modal.init(el);

    const elems = document.querySelectorAll('.v-tooltipped');
    M.Tooltip.init(elems);

    this.initializeStitchAndLogin();
  },

  methods: {
    initializeStitchAndLogin: function() {
      Stitch.initializeDefaultAppClient('insights-xavlz');

      const client = Stitch.defaultAppClient;
      client.auth.loginWithCredential(new AnonymousCredential())
        .then(user => {
          this.stitchClientObj = client;
          this.stitchUserObj = user;
          this.getInsightsFromStitch();
          this.getUserDataFromStitch(user.id);
        })
        .catch(error => {
          console.log(error);
        });
    },

    getUserDataFromStitch: function(id) {
      this.stitchClientObj.callFunction('getUserData', [id])
        .then(result => {
          this.userData = result;
        })
        .catch(error => {
          console.log('Error from calling getUserData function');
          console.log(error);
        });
    },

    getInsightsFromStitch: function() {
      this.stitchClientObj.callFunction('getInsights', [this.org.ein])
        .then(result => {
          this.insights = result;
        })
        .catch(error => {
          console.log('Error from calling getInsights function');
        });
    },
    
    getListFromLocalStorage: function() {
      return JSON.parse(localStorage.getItem('profiles')) || [];
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
    
    updateProfilesList: function(data) {
      this.profiles = data;
    },
  },
};
</script>
