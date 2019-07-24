<template>
  <div
    id="enativ"
    ref="modal"
    class="modal"
  >
    <div class="modal-content">
      <h4><i class="material-icons grantmakers-text">error</i>Automated queries detected</h4>
      <p>Your computer is using software that sends automated queries. This negatively impacts other users.</p>
      <p>To ensure Grantmakers.io remains free for everyone, we can't process your request right now.</p>
      <p
        class="text-bold"
      >
        Please whitelist Grantmakers.io.
      </p>
      <p>Software detected: <em>eNativ</em></p>
    </div>
    <div class="modal-footer">
      <a
        href="mailto:enativusers@grantmakers.io"
        class="btn-flat"
      >
        Contact Us
      </a>
    </div>
  </div>
</template>

<script>
export default {
};
</script>
