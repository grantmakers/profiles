<template>
  <div class="left-action-bar hide-on-med-and-down">
    <ul class="z-depth-3">
      <li>
        <a
          :data-tooltip="save ? 'Save this profile' : 'Unsave this profile'"
          :data-ga=" save ? 'Save profile via Left Action Bar' : 'Unsave profile via Left Action Bar' "
          class="tooltipped v-tooltipped"
          data-position="right"
          @click="handleSaveClick"
        >
          <i class="material-icons">{{ save ? 'star_outline' : 'star' }}</i>
          <span>{{ save ? 'SAVE' : 'SAVED' }}</span>
        </a>
      </li>
      <li>
        <a
          :href="buildProfileMailto(org)"
          target="_blank"
          class="tooltipped v-tooltipped"
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
</template>

<script>
import mixins from '../mixins.js';

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
  },

  data: function() {
    return  {
      save: true,
    };
  },

  mounted: function() {
    this.setInitialSaveState();
  },

  methods: {
    setInitialSaveState: function() {
      const profiles = this.$props.profiles;
      const org = this.$props.org;
      if (profiles) {
        for (let i = 0; i < profiles.length; i++) {
          if (profiles[i].ein === org.ein) {
            this.save = false;
          }
        }
      }
    },

    handleSaveClick: function(e) {
      this.hideTooltip(e);
      this.save ? this.addProfile(this.org) : this.removeProfile(this.org);
      this.save = !this.save;
    },

    handleCopy: function(e) {
      const self = this;
      // let container = this.$refs.container; // Would just need to add ref="container" to modal
      // this.$copyText("Text to copy", container)
      this.$copyText('Text to copy')
        .then(function() {
          self.hideTooltip(e);
          self.handleCopyClick();
        }, function() {
          self.handleFailedCopy();
        });
    },

    addProfile(data) {
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
