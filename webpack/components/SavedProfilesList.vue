<template>
  <div
    id="modal-saved-profiles"
    class="modal"
  >
    <div class="modal-content">
      <div class="saved-profiles">
        <div> <!-- on full page, use container-custom -->
          <div class="row">
            <div class="col s12"> <!-- on full page, use l8 offset-l2 -->
              <h5>Saved Profiles
                <span
                  class="new badge blue"
                  data-badge-caption="BETA"
                />
              </h5>
            </div>
          </div>
          <div class="row">
            <div class="col s12">
              <div v-if="profiles.length">
                <ul class="collection">
                  <SavedProfile
                    v-for="profile in profiles"
                    :key="profile.ein"
                    :profile="profile"
                    @remove="removeProfile"
                  />
                </ul>
                <div class="row">
                  <div class="col s12"> <!-- on full page, use l8 offset-l2 -->
                    <p>
                      BETA: While we're testing this feature, if you reset your browser your saved profiles will be lost.<br>
                      <span class="small text-muted-max">
                        So don't clear your browser data!
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div
                v-else
                id="saved-blank-state"
                class="row"
              >
                <div class="col l4 offset-l4 center-align">
                  <!-- TODO How to leverage jekyll for a relative path? -->
                  <img
                    class="responsive-img"
                    src="/profiles/assets/img/illustration-save.png"
                    alt="Save illustration"
                  >
                  <p>
                    Save profiles to this list by clicking the <i class="material-icons blue-grey-text">star</i> button on any profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SavedProfile from './SavedProfile.vue';

export default {
  components: {
    SavedProfile,
  },

  props: {
    profiles: {
      type: Array,
      default: () => [],
    },
  },
  
  methods: {
    addProfile(data) {
      // TODO make asynchronous
      let arr = JSON.parse(localStorage.getItem('profiles'));
      if (!Array.isArray(arr) || !arr.length) {
        arr = [];
      }
      data.saved_on = new Date().toISOString();
      arr.unshift(data);
      localStorage.setItem('profiles', JSON.stringify(arr));
      this.$emit('update', arr);
    },

    removeProfile(data) {
      let ein = data.ein;
      let arr = JSON.parse(localStorage.getItem('profiles'));
      const after = arr.filter(function(a) { return a.ein !== ein;});
      localStorage.setItem('profiles', JSON.stringify(after));
      this.$emit('update', after);
    },
  },
};
</script>
