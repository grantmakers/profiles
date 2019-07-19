<template>
  <transition name="fade">
    <div
      v-if="showLeftActionBar"
      class="left-action-bar hide-on-med-and-down"
    >
      <ul class="z-depth-3">
        <li class="hidden">
          <a
            :data-tooltip="save ? 'Save this profile' : 'Unsave this profile'"
            :data-ga=" save ? 'Save profile via Left Action Bar' : 'Unsave profile via Left Action Bar' "
            class="tooltipped v-tooltipped"
            data-position="right"
            @click="handleSaveClick"
          >
            <i
              :class="{ 'md-spin': isLoading }"
              class="material-icons"
            >
              {{ save ? 'star_outline' : 'star' }}
            </i>
            <span>{{ save ? 'SAVE' : 'SAVED' }}</span>
          </a>
        </li>
        <li>
          <a
            :href="buildProfileMailto(org)"
            target="_blank"
            class="tooltipped v-tooltipped"
            title="Share this profile via email"
            data-tooltip="Share this profile via email"
            data-position="right"
            data-ga="Share Profile via Left Action Bar"
          >
            <i class="material-icons">email</i>
            <span>Share</span>
          </a>
        </li>
        <li>
          <a
            v-clipboard:copy="org.url"
            class="tooltipped v-tooltipped"
            title="Copy link to clipboard"
            data-tooltip="Copy link to clipboard"
            data-position="right"
            data-ga="Copy Link via Left Action Bar"
            @click="handleCopy"
          >
            <i class="material-icons">link</i>
            <span>Copy link</span>
          </a>
        </li>
      </ul>
    </div>
  </transition>
</template>

<script>
import mixins from '../mixins.js';
import bugsnagClient from '../utils/bugsnag.js';

export default {
  mixins: [mixins],
  
  props: {
    org: {
      type: Object,
      default: () => {},
    },
    profiles: {
      type: Array,
      default: () => [],
    },
    stitchClientObj: {
      type: Object,
      default: () => this.stitchClientObj,
    },
  },

  data: function() {
    return  {
      isLoading: false,
      showLeftActionBar: false,
    };
  },

  computed: {
    save: {
      get: function() {
        return this.computeSaveStatus();
      },
      set: function() {
        return this.computeSaveStatus();
      },
    },
  },

  created() {
    window.addEventListener('scroll', this.scrollSpy);
  },

  destroyed: function() {
    window.removeEventListener('scroll', this.scrollSpy);
  },

  methods: {
    scrollSpy: function() {
      const target = document.getElementById('scrollspy-target');
      if (target.classList.contains('affix')) {
        this.showLeftActionBar = true;
        window.removeEventListener('scroll', this.scrollSpy);
      }
    },

    handleSaveClick: function(e) {
      this.isLoading = true;
      // this.hideTooltip(e);
      this.save ? this.addProfile(this.org) : this.removeProfile(this.org);
      this.save = !this.save;
    },

    handleCopy: function(e) {
      const self = this;
      // let container = this.$refs.container; // Would just need to add ref="container" to modal
      // this.$copyText("Text to copy", container)
      this.$copyText('Text to copy')
        .then(function() {
          // self.hideTooltip(e);
          self.handleCopyClick();
        }, function() {
          self.handleFailedCopy();
        });
    },

    computeSaveStatus: function() {
      const profiles = this.$props.profiles;
      const org = this.$props.org;
      let output = true;
      if (profiles.length > 0) {
        for (let i = 0; i < profiles.length; i++) {
          if (profiles[i].ein === org.ein) {
            output = false;
          }
        }
      }
      return output;
    },

    addProfile(data) {
      this.stitchClientObj.callFunction('addSavedProfile', [data])
        .then(result => {
          // TODO Currently assume any response means a successful insertion
          // TODO If not successful, retry call?
          this.$emit('updateAdd', data);
          this.isLoading = false;
          // If new user, show FeatureDiscovery
          if (result.upsertedId) {
            this.showFeatureDiscovery();
          } else {
            // TODO Ensure M is available
            M.toast({
              'html': 'Profile saved',
              'displayLength': 1500,
            });
          }
        })
        .catch(error => {
          bugsnagClient.notify(new Error('Stitch addProfile - ' + error), {
            metaData: {'stitch': 'addProfile'},
          });
        });
    },

    removeProfile(data) {
      let ein = data.ein;
      this.stitchClientObj.callFunction('removeSavedProfile', [ein])
        .then(result => {
          // TODO Currently assume any response means a successful insertion
          // TODO If not successful, retry call?
          // Error is anything other than:
          // {matchedCount: 1, modifiedCount: 1}

          this.$emit('updateRemove', ein);
          this.isLoading = false;
          // TODO Ensure M is available
          M.toast({
            'html': 'Profile removed',
            'displayLength': 1500,
          });
        })
        .catch(error => {
          bugsnagClient.notify(new Error('Stitch removeProfile - ' + error), {
            metaData: {'stitch': 'removeProfile'},
          });
        });
    },

    showFeatureDiscovery() {
      const el = document.getElementById('tap-target-saved-profiles');
      // TODO Ensure M is available
      M.TapTarget.init(el);
      const instance = M.TapTarget.getInstance(el);
      instance.open();
    },
  },
};
</script>
