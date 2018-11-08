<template>
  <ul
    v-if="insights.length"
    class="collection"
  >
    <li
      v-for="(item, index) in insights"
      :key="index"
      class="collection-item avatar"
    >
      <span class="title">{{ item.title }}</span><br>
      {{ item.key }}
      <p>{{ item.text }}</p>
      <small><em>submitted by:</em> {{ item.author.full_name_displayed }}</small>
    </li>
    <li>
      <hr class="slim">
    </li>
  </ul>
</template>

<script>
import bugsnagClient from '../utils/bugsnag.js';
export default {
  props: {
    insights: {
      type: Array,
      required: true,
    },
  },

  mounted: function() {
    // Render to insights element outside Vue app
    // Limit to browsers supporting prepend(), else destroy Insights component
    try {
      document.getElementById('insights').prepend(this.$el);
    } catch (error) {
      this.$destroy();
      bugsnagClient.notify(new Error('Unable to add Insights to DOM. Vue Insights component destroyed. - ' + error), {
        metaData: {'vue': 'insert insights to DOM using prepend()'},
      });
    }
  },
};
</script>
