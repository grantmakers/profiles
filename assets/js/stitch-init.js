---
---
$(document).ready(function() {
  const targetEIN = $('h1.org-name').data('ein').toString();
  // Stitch
  const appID = 'insights-xavlz';
  let stitchClient;

  initializeClient().then(() => {
    // Call Stitch Function to fetch insights
    return stitchClient.executeFunction('getInsights', targetEIN)
  })
    .then(displayInsights)
    .catch(console.error);

  function initializeClient() {
  // Creates a new StitchClient and assigns it to a global variable,
  // then authenticates a user anonymously. Returns a promise.
    return stitch
      .StitchClientFactory
      .create(appID)
      .then(client => {
        stitchClient = client;
        return stitchClient.login();
      });
  }

  function displayInsights(items) {
    if (items.length) {
      const insightsDiv = '#insights';
      const stitchResults = items.map(item => {
        return `{% include stitch/insights-item.html %}`
      }).join('');
      $(insightsDiv).prepend(stitchResults);
      $.fn.matchHeight._update();
      $('.card-action-community-alert').show();
    }
  }
});
