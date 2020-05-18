function ready(fn) {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  // Profile header links
  document.querySelectorAll('.navbar-profile [data-ga]').forEach((each) => {
    each.addEventListener('click', e => {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile Header Click',
        'eventLabel': e.target.dataset.ga,
      });
    });
  });

  // Summary icon clicks
  document.querySelectorAll('.js-ga-summary-icon-click').forEach((each) => {
    each.addEventListener('click', e => {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile Summary Icon Click',
        'eventLabel': e.target.dataset.ga,
      });
    });
  });

  // Clicks to foundation websites
  document.querySelectorAll('.js-ga-website-click').forEach((each) => {
    each.addEventListener('click', e => {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile Org Website Click',
        'eventLabel': e.target.dataset.ga,
      });
    });
  });

  // Table sort (Algolia table)
  // See search.js

  // Algolia grants search box
  // see search.js

  // Algolia Autocomplete search box
  document.getElementById('autocomplete-input').addEventListener('focus', () => {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Search Focus',
      'eventLabel': 'Autocomplete search',
    });
  });

  // Tax filings
  document.querySelectorAll('#filings ul li a').forEach((each) => {
    each.addEventListener('click', e => {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile Tax Filings Click',
        'eventLabel': e.target.dataset.ga,
      });
    });
  });

  // Left Action Bar
  document.querySelectorAll('.left-action-bar a').forEach((each) => {
    each.addEventListener('click', e => {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile Left Action Bar Click',
        'eventLabel': e.target.dataset.ga,
      });
    });
  });

  // Charts
  // see profile.js

  // Bottom CTAs: Share and feedback buttons
  document.querySelectorAll('#profile-share a, #community a, #feedback a, #application-info a, #search-links a, #coffee-bottom-cta a').forEach((each) => {
    each.addEventListener('click', e => {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile Bottom CTAs',
        'eventLabel': e.target.dataset.ga,
      });
    });
  });

  // Footer links
  document.querySelectorAll('footer a, .footer-terms a').forEach((each) => {
    each.addEventListener('click', e => {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile Footer Click',
        'eventLabel': e.textContent || e.target.dataset.ga,
      });
    });
  });

  // Note: URLs are cleaned of UTM info AFTER the intial pageview is send to GA
  // This was moved to the initial pageview send, currently located in a Jekyll include
});
