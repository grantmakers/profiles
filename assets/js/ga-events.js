$(document).ready(function() {
  // Profile header links
  $('.navbar-profile [data-ga]').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Header Click',
      'eventLabel': $(this).data('ga'),
    });
  });

  // Summary icon clicks
  $('.js-ga-summary-icon-click').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Summary Icon Click',
      'eventLabel': $(this).data('ga'),
    });
  });

  // Clicks to foundation websites
  $('.js-ga-website-click').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Org Website Click',
      'eventLabel': $(this).data('ga'),
    });
  });

  // Table sort (Algolia table)
  // See search.js

  // Table sort (static table)
  $('#grantsTable th').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Table Sort Click',
      'eventLabel': $(this).find('span').text(),
    });
  });

  // Algolia grants search box
  $('#search-input').on('focus', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Search Focus',
      'eventLabel': 'Grants search',
    });
  });

  // Algolia Autocomplete search box
  $('#autocomplete-input').on('focus', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Search Focus',
      'eventLabel': 'Autocomplete search',
    });
  });

  // Tax filings
  $('#filings ul li a').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Tax Filings Click',
      'eventLabel': $(this).data('ga'),
    });
  });

  // Left Action Bar
  $('.left-action-bar a').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Left Action Bar Click',
      'eventLabel': $(this).data('ga'),
    });
  });

  // Bottom CTAs: Share and feedback buttons
  $('#profile-share a, #community a, #feedback a, #application-info a').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Bottom CTAs',
      'eventLabel': $(this).data('ga'),
    });
  });

  // Footer links
  $('footer a, .footer-terms a').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Footer Click',
      'eventLabel': $(this).text(),
    });
  });

  // Remove UTM parameters
  const win = window;
  ga('send', 'pageview', { 'hitCallback': removeUtms() });
  
  function removeUtms() {
    const location = win.location;
    if (location.search.indexOf('utm_') !== -1 && history.replaceState) {
      history.replaceState({}, '', window.location.toString().replace(/(\&|\?)utm([_a-z0-9=]+)/g, ''));
    }
  }
});
