$(document).ready(function() {
  // Profile header links (except scrolly click events for center three links...already included in profile.js)
  $('.navbar [data-ga]').on('click', function() {
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Header Click',
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

  // Table sort
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

  // Bottom CTAs: Share and feedback buttons
  $('#profile-share a').on('click', function() {
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
});
