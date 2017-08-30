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
    } else if ( calc < '0' ) {
      header.css({ 'opacity': 0 });
      navbar.addClass('affix');
      navbar.removeClass('affix-top');
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

  if ($('.pushpin-nav').length) {
    $('.pushpin-nav').each(function() {
      var $this = $(this);
      var $target = $('#' + $(this).attr('data-target'));
      var $id = $(this).attr('data-target');
      var targetTop;
      var targetBottom;
      if ($id == 'main-nav') {
        targetBottom = $('#grants').offset().top - $('.pushpin-nav-search').height();
      } else {
        targetBottom = $target.offset().bottom;
      }
      $this.pushpin({
        top: $target.offset().top,
        //bottom: $target.offset().top + $target.outerHeight() - $this.height()
        bottom: targetBottom
      });
    });
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

  // Import feedback.js
  // =======================================================
  $.getScript('{{ site.baseurl }}/assets/js/feedback.js');
});
