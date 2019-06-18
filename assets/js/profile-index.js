---
---
$(document).ready(function() {
  'use strict';

  // Navbar
  // =======================================================
  const header = $('.header');
  const navbar = $('.navbar-profile');
  const range = 64; // Height of navbar

  $(window).on('scroll', function() {
    let scrollTop = $(this).scrollTop();
    let height = header.outerHeight();
    let offset = height / 2;
    let calc = 1 - (scrollTop - offset + range) / range;

    header.css({ 'opacity': calc });

    if (calc > '1') {
      header.css({ 'opacity': 1 });
      navbar.addClass('affix-top');
      navbar.removeClass('affix');
    } else if ( calc < '0' ) {
      header.css({ 'opacity': 0 });
      navbar.addClass('affix');
      navbar.removeClass('affix-top');
    }
  });

  // Materialize components
  // =======================================================
  window.onload = function() {
    $('.sidenav').sidenav();
    $('.tooltipped:not(.v-tooltipped)').tooltip(); // :not ensures Vue handles relevant initiation for Vue-controlled elements
    $('.collapsible').collapsible({
      'accordion': false,
    });
  };
});
