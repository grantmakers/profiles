---
---
$(document).ready(function() {

  // Navbar
  // =======================================================

  var header = $('.header');
  var navbar = $('.navbar-profile');
  var range = 64;

  $(window).on('scroll', function () {
    
    var scrollTop = $(this).scrollTop(),
        height = header.outerHeight(),
        offset = height / 2,
        calc = 1 - (scrollTop - offset + range) / range;

    header.css({ 'opacity': calc });

    if (calc > '1') {
      header.css({ 'opacity': 1 });
      navbar.addClass('affix-top');
      navbar.removeClass('affix');
      //$('.algolia-partnership-logo img').attr('src', '{{ site.baseurl}}/assets/img/algolia-partnership-logo.png');
    } else if ( calc < '0' ) {
      header.css({ 'opacity': 0 });
      navbar.addClass('affix');
      navbar.removeClass('affix-top');
      //$('.algolia-partnership-logo img').attr('src', '{{ site.baseurl}}/assets/img/algolia-partnership-logo-light.png');
    }

  });

  // Materialize components
  // =======================================================
  $('.button-collapse').sideNav();
  $('.collapsible').collapsible({
    accordion : false
  });
  $('.collapsible-grants-table .collapsible-header').click(function() {
    // TODO Show progress bar while data is loading
    // Waiting for Materialize v1.0 as plugins are being refactored
    // https://github.com/Dogfalo/materialize/issues/5004
  });

  // Fixed headers via Pushpin
  // Disable on mobile for now
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');
  function enableGrantsFixedHeader () {
    const grantsHeader = $('#grants .card-panel-header');
    grantsHeader.addClass('pushpin-nav pushpin-nav-search');
    grantsHeader.attr('data-target', 'grants');
  }

  if (!isMobile.matches) {
    enableGrantsFixedHeader();
  }

  if ($('.pushpin-nav').length) { // TODO checks for Algolia results
    $('.pushpin-nav').each(function() {
      var $this = $(this);
      var $target = $('#' + $(this).attr('data-target'));
      var $id = $(this).attr('data-target');
      var targetBottom;
      if ($id == 'main-nav') {
        targetBottom = $('#grants').offset().top - $('.pushpin-nav-search').height();
      } else {
        targetBottom = $target.offset().top + 1400;
        // Due to Algolia delay in displaying results, any element underneath #grants will show the wrong location
        // TODO Fix hard-coded hack
        // targetBottom = $('#filings').offset().top;
      }
      $this.pushpin({
        top: $target.offset().top,
        bottom: targetBottom
      });
    });

    {% if jekyll.environment == 'staging' %}
      var targetURL = 'https://www.grantmakers.io' + window.location.pathname; 
      var $toastStaging = $('<span>This is a preview site</span>').add($('<a href="' + targetURL + '" class="btn-flat toast-action">Go to the live site</a>'));
      Materialize.toast($toastStaging, 2000);
    {% endif %}
  }

  // SMOOTH SCROLL
  // =======================================================
  $('.nav-primary li a.scrolly').on('click', function(e) {
    e.preventDefault();
    // collapse mobile header
    $('.button-collapse').sideNav('hide');

    // store hash
    var hash = this.hash;

    // animate
    $('html, body').animate({
      'scrollTop': $(this.hash).offset().top - 120,
    }, 300, function() {
      // when done, add hash to url
      // (default click behaviour)
      window.location.hash = hash;
    });

    // google analytics
    var text = $(this).text();
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Header Click',
      'eventLabel': text,
    });
  });


  // Enable table sort via StupidTable
  // =======================================================
  if( $( "#grantsTable" ).length ) {
    $('#grantsTable').stupidtable();
  }

  // Filings
  // =======================================================
  // Add filing links
  $('.js-filings-pdf').each(function() {
    addFilingURL($(this));
  });
  
  function addFilingURL(el) {
    var ein = el.data('ein');
    var einShort = ein.toString().substring(0, 3);
    var taxPeriod = el.data('tax-period');
    // Foundation Center: http://990s.foundationcenter.org/990pf_pdf_archive/272/272624875/272624875_201412_990PF.pdf
    var urlPDF = 'http://990s.foundationcenter.org/990pf_pdf_archive/' +
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
    const elem = $(this);
    const target = $(this).attr('href');
    $.ajax({
      method: 'POST',
      url: gcf,
      data: { target: target }
    })
    .done(function( res ) {
      if (res) {
        window.location.href = target;
      } else {
        elem.addClass('disabled');
        Materialize.toast('PDF not yet available. Try a prior year.', 5000)
      }
    })
    .fail(function(xhr, textStatus, error){
      var $toastContent = $('<span>Something went wrong.</span>').add($('<button href="http://foundationcenter.org/find-funding/990-finder" class="btn-flat toast-action">Try Here.</button>'));
      Materialize.toast($toastContent, 10000);
    });
  });
});
