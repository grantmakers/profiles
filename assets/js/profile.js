---
---
$(document).ready(function() {
  'use strict';
  // BROWSER CHECKS
  // =======================================================
  // TODO Need to refactor initial browser checks - this is a mess!
  const isIE11 = !!window.MSInputMethodContext && !!document.documentMode; // Note: does not detect <IE11
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');
  const hasAlgolia = $('#grants .card-panel-header .search');
  let isSupported = browserTest();
  let allowsCookies = cookieTest();
  let allowsLocalStorage = storageTest();

  // Load Vue if supported
  const vue = document.createElement('script');
  // TODO Load bundle.js upon click
  vue.src = '{{ site.baseurl }}/assets/js/bundle.js?v={{ site.time | date: "%Y%m%d"}}';
  if (!isIE11 && !isMobile.matches && allowsCookies && allowsLocalStorage && isSupported) {
    // document.body.appendChild(vue);
  } else {
    $('.js-vue-check').addClass( 'hidden' ); // Hide UI elements created in DOM, but handled by Vue
  }

  // Show message if not supported
  if (isIE11 || !isSupported) {
    const toastContent = '<span>Your browser is currently not supported.<br>Many useful features may not work.</span><button href="https://outdatedbrowser.com/en" class="btn-flat yellow-text toast-action-browser-suggestion">Browser Suggestions</button>';
    M.Toast.dismissAll();
    M.toast({
      'html': toastContent,
      'displayLength': 10000,
    });
    $('.toast-action-browser-suggestion').on('click', function() {
      const target = $(this).attr('href');
      window.location.href = target;
    });
    // Hide Algolia elements
    $('.js-ie-check').addClass( 'hidden' );
  }
  
  function browserTest() {
    const parent = document.createElement('div');
    const el = document.createElement('span');
    try {
      parent.prepend(el); // Using ParentNode.prepend() as proxy for supported browsers
      return true;
    } catch (e) {
      return false;
    }
  }

  function cookieTest() {
    let cookieEnabled = navigator.cookieEnabled;
    if (!cookieEnabled) {
      document.cookie = 'testcookie';
      cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
      document.cookie = 'testcookie; expires=Thu, 01-Jan-1970 00:00:01 GMT';
    }
    return cookieEnabled || showCookieFail();
  }

  function showCookieFail() {
    if (!isIE11 && isSupported) {
      M.toast({
        'html': 'Enable cookies to view available profile updates',
      });
    }
    return false;
  }

  function storageTest() {
    const test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // NAVBAR
  // =======================================================
  const header = $('.header');
  const navbar = $('.navbar-profile');
  const range = 64; // Height of navbar

  // Set header opacity on page load
  setHeaderOpacity();

  // Adjust opacity after scrolling
  $(window).on('scroll', function() {
    setHeaderOpacity();
  });

  function setHeaderOpacity() {
    let scrollTop = $(window).scrollTop();
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
  }

  // INIT MATERIALIZE COMPONENTS
  // =======================================================
  window.onload = function() {
    const elemsNavMore = document.getElementById('primary-navbar-dropdown-trigger');
    const optionsNavMore = {
      'container': 'main-nav',
      'constrainWidth': false,
    };
    M.Dropdown.init(elemsNavMore, optionsNavMore);
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

  // FIXED HEADERS
  // =======================================================
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

  // SMOOTH SCROLL
  // =======================================================
  $('.scrolly').click(function(e) {
    e.preventDefault();
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

  // FILINGS
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
      .fail(function(xhr, textStatus, error) { // eslint-disable-line no-unused-vars
        const toastContent = '<span>Something went wrong.</span><button href="http://foundationcenter.org/find-funding/990-finder" class="btn-flat toast-action">Try Here.</button>';
        M.Toast.dismissAll();
        M.toast({
          'html': toastContent,
          'displayLength': 10000,
        });
      });
  });
});
