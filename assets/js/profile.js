---
---
$(document).ready(function() {
  'use strict';
  const isIE11 = !!window.MSInputMethodContext && !!document.documentMode; // Note: does not detect <IE11
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');
  const hasAlgolia = $('#grants .card-panel-header .search');
  let isSupported = true;

  browserTest();
  cookieTest();

  // Load Vue bundle.js
  const vue = document.createElement('script');
  vue.src = '{{ site.baseurl }}/assets/js/bundle.js?v={{ site.time | date: "%Y%m%d"}}';
  if (!isMobile.matches && isSupported) {
    document.body.appendChild(vue);
  }

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
    let calcInverse = (scrollTop - offset + range) / range;

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
    $('#community-sidebar').sidenav({ 'edge': 'right'});
    $('.tooltipped:not(.v-tooltipped)').tooltip(); // :not ensures Vue handles relevant initiation for Vue-controlled elements
    $('.collapsible').collapsible({
      'accordion': false,
    });

    $('.collapsible-grants-table').collapsible({
      'accordion': false,
      // TODO Use onOpenStart to add spinning icon
      // onOpenStart: function(el) {
      //   $(el).find('.collapsible-header i').addClass('md-spin');
      // }
      'onOpenEnd': function(el) {
        $(el).find('.collapsible-header i').removeClass('md-spin');
      },
    });
    
    // TODO Use onOpenStart to add spinning icon
    // Unsure of root cause - possible Materialize bug?
    $('.collapsible-grants-table .collapsible-header').click(function(e) {
      if (!$(this).parent().hasClass('active')) {
        e.stopPropagation();
        $(this).find('i').addClass('md-spin');
        $(this).find('i').removeClass('bounce');
        setTimeout(function() {
          $('.collapsible-grants-table').collapsible('open');
        }, 100);
      }
    });
  };

  // Unsupported browser messaging
  // TODO Feels verbose
  function browserTest() {
    const parent = document.createElement('div');
    const el = document.createElement('span');
    try {
      // Use ParentNode.prepend() as proxy for supported browsers
      // https://caniuse.com/#search=prepend
      parent.prepend(el);
    } catch (e) {
      isSupported = false;
    }
  }

  function cookieTest() {
    let cookieEnabled = navigator.cookieEnabled;
    if (!cookieEnabled) { 
      document.cookie = 'testcookie';
      cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
    }
    return cookieEnabled || showCookieFail();
  }

  function showCookieFail() {
    // do something here
    // Can't show toasts until materialize initialized
  }

  if (isIE11 || !isSupported) {
    // Provide alert message
    const toastContent = '<span>Your browser is currently not supported.<br>Many useful features may not work.</span><button href="http://outdatedbrowser.com/en" class="btn-flat yellow-text toast-action-browser-suggestion">Browser Suggestions</button>';
    M.Toast.dismissAll();
    M.toast({
      'html': toastContent,
      'displayLength': 10000,
    });
    $('.toast-action-browser-suggestion').on('click', function() {
      const target = $(this).attr('href');
      window.location.href = target;
    });
    // Hide dynamic elements
    // Note existing community insights div simply won't add any items from MongoDB Stitch
    $('.js-ie-check').addClass( 'hidden' );
    // Show static table instead of Algolia
    // $('.collapsible-grants-table').collapsible('open'); // Does not work in IE11 :(
  }

  // Fixed headers via Pushpin plugin
  // Grants header is fixed only on non-mobile devices with Algolia enabled
  // See also search.js - Need to re-init grants header after search results populate to capture proper div height

  function enableGrantsFixedHeader() {
    const grantsHeader = $('#grants .card-panel-header');
    grantsHeader.addClass('pushpin-nav pushpin-nav-search');
    grantsHeader.attr('data-target', 'grants');
  }

  if (!isMobile.matches && hasAlgolia.length && !isIE11) {
    enableGrantsFixedHeader();
  }

  if ($('.pushpin-nav').length) {
    $('.pushpin-nav').each(function() {
      let $this = $(this);
      let $id = $(this).attr('data-target');
      let $target = $('#' + $(this).attr('data-target'));
      let targetBottom = $target.offset().top + $target.height();
      let targetOffset = 0;
      if ($id === 'main-nav') {
        targetBottom = Infinity;
      } else {
        targetOffset = range;
      }
      $this.pushpin({
        'top': $target.offset().top,
        'bottom': targetBottom,
        'offset': targetOffset,
      });
    });
  }

  // LEFT ACTION BAR
  // =======================================================
  // Capture current org info for localStorage
  function checkForLocalStorage() {
    const test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  if ($('body').hasClass('profile-page')) {
    // Save Profile
    if (checkForLocalStorage() !== true) {
      $('[data-js="save"]').parent().hide();
    }
  }

  // SMOOTH SCROLL
  // =======================================================
  $('.scrolly').click(function() {
    const target = $(this).attr('href');
    const newPosition = $(target).offset().top - 64;
    $('html, body').stop().animate({ 'scrollTop': newPosition }, 500);
  });

  $('.nav-primary li a.scrolly').on('click', function() {
    // collapse mobile header
    if (isMobile.matches) {
      $('.sidenav').sidenav('close');
    }
  });

  // Enable table sort via StupidTable
  // =======================================================
  if ( $( '#grantsTable' ).length ) {
    $('#grantsTable').stupidtable();
  }

  // Filings
  // =======================================================
  // Add filing links
  $('.js-filings-pdf').each(function() {
    addFilingURL($(this));
  });
  
  function addFilingURL(el) {
    const ein = el.data('ein');
    const einShort = ein.toString().substring(0, 3);
    const taxPeriod = el.data('tax-period');
    // Foundation Center: http://990s.foundationcenter.org/990pf_pdf_archive/272/272624875/272624875_201412_990PF.pdf
    const urlPDF = 'http://990s.foundationcenter.org/990pf_pdf_archive/' +
                 einShort + '/' +
                 ein + '/' +
                 ein + '_' +
                 taxPeriod + '_990PF.pdf';
    el.attr('data-url-pdf', urlPDF);
    el.attr('href', urlPDF);
  }

  // Check if filing is available
  const gcf = 'https://us-central1-infinite-badge-163220.cloudfunctions.net/checkUrl';
  
  $('.js-filings-pdf').click(function(e) {
    e.preventDefault();
    M.toast({
      'html': 'Redirecting to latest 990...',
    });
    const elem = $(this);
    const target = $(this).attr('href');
    $.ajax({
      'method': 'POST',
      'url': gcf,
      'data': { 'target': target },
    })
      .done(function( res ) {
        if (res) {
          window.location.href = target;
        } else {
          elem.addClass('disabled');
          M.Toast.dismissAll();
          M.toast({
            'html': 'PDF not yet available. Try a prior year.',
          });
        }
      })
      .fail(function(xhr, textStatus, error) {
        const toastContent = '<span>Something went wrong.</span><button href="http://foundationcenter.org/find-funding/990-finder" class="btn-flat toast-action">Try Here.</button>';
        M.Toast.dismissAll();
        M.toast({
          'html': toastContent,
          'displayLength': 10000,
        });
      });
  });
});
