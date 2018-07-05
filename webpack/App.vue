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
  </div>
</template>

<script>
import ActionBar from './components/ActionBar';
import SavedProfilesList from './components/SavedProfilesList';

export default {
  components: {
    ActionBar,
    SavedProfilesList,
  },

  data: function() {
    return {
      profiles: this.getListFromLocalStorage(),
      org: this.getCurrentOrgData(),
    };
  },

  mounted: function() {
    // Initialize Materialize components modal
    const el = document.getElementById('modal-saved-profiles');
    M.Modal.init(el);

    const elems = document.querySelectorAll('.v-tooltipped');
    M.Tooltip.init(elems);
  },

  methods: {
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
