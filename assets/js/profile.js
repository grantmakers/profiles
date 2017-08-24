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
  $('ul.tabs').tabs();

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
