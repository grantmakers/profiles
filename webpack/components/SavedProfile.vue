<template>
  <li class="collection-item">
    <a
      :href="profile.url"
      class="saved-profile-link"
    >
      {{ profile.name }}
    </a>
  </li>
</template>

<script>
export default {
  props: {
    profile: {
      type: Object,
      required: true,
    },
  },
};
</script>
