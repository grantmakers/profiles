export default {
  methods: {
    buildProfileMailto: function(data) {
      const name = encodeURIComponent(data.name);
      let mailto = 'mailto:?to=&subject=Grantmakers.io%20Profile%20-%20' +
                  name +
                  '&body=%0D%0A%0D%0A' +
                  name +
                  '%0D%0A' +
                  data.url;
      return mailto;
    },
    hideTooltip: function(e) {
      const tooltip = M.Tooltip.getInstance(e.currentTarget);
      tooltip.close();
    },
    handleCopyClick: function() {
      M.toast({
        'html': 'Copied to clipboard',
      });
    },
    handleFailedCopy: function() {
      M.toast({
        'html': 'Sorry, copy failed. Try again.',
      });
    },
  },
};
