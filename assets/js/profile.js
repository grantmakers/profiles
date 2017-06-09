$(document).ready(function() {
  // Enable Material Design ripples and Bootstrap components
  // =======================================================

  $.material.init(); // Initialize Material Design ripples
  $('[data-toggle="tooltip"], [rel="tooltip"]').tooltip(); // Enable tooltips


  // Enable table sort via StupidTable
  // =======================================================
  $('#grantsTable').stupidtable();

  // SMOOTH SCROLL
  // =============
  // simple smooth scrolling for bootstrap scroll spy nav
  // credit http://stackoverflow.com/questions/14804941/how-to-add-smooth-scrolling-to-bootstraps-scroll-spy-function

  $('.navbar-nav li a[href^="#"], .scrolly').on('click', function(e) {
    e.preventDefault();
    // collapse mobile header
    $('#navigation-index').collapse('hide');

    // store hash
    let hash = this.hash;

    // animate
    $('html, body').animate({
      'scrollTop': $(this.hash).offset().top - 120,
    }, 300, function() {
      // when done, add hash to url
      // (default click behaviour)
      window.location.hash = hash;
    });

    // google analytics
    let text = $(this).text();
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Header Click',
      'eventLabel': text,
    });
  });

  // FORMATTING
  // ==========

  // Format numbers and currency
  let formatCurrency = new Intl.NumberFormat('en-US', {
    'style': 'currency',
    'currency': 'USD',
    'currencyDisplay': 'symbol',
    'minimumFractionDigits': 0,
  });

  // Format numbers and currency
  let formatCurrencyList = new Intl.NumberFormat('en-US', {
    'style': 'decimal',
    'currency': 'USD',
    // currencyDisplay: 'symbol',
    'minimumFractionDigits': 0,
  });

  // Format numbers and currency
  let formatNumber = new Intl.NumberFormat('en-US', {
    'style': 'decimal',
    'minimumFractionDigits': 0,
    'maximumFractionDigits': 2,
  });

  // Format dollar amounts and currency figures
  $('.format-currency').each(function() {
    let n = $(this).text();
    let formattedNumber = formatCurrency.format(n);
    $(this).text(formattedNumber);
  });

  // Format dollar amounts and currency figures
  $('.format-currency-list').each(function() {
    let n = $(this).text();
    let formattedNumber = formatCurrencyList.format(n);
    $(this).text(formattedNumber);
  });

  // Format numbers
  $('.format-number').each(function() {
    let n = $(this).text();
    let formattedNumber = formatNumber.format(n);
    $(this).text(formattedNumber);
  });

  // Filings
  $('.js-filings-pdf').each(function() {
    addFilingURL($(this));
  });
  
  function addFilingURL(el) {
    let ein = el.data('ein');
    let einShort = ein.toString().substring(0, 3);
    let taxPeriod = el.data('tax-period');
    // Foundation Center: http://990s.foundationcenter.org/990pf_pdf_archive/272/272624875/272624875_201412_990PF.pdf
    let urlPDF = 'http://990s.foundationcenter.org/990pf_pdf_archive/' +
                 einShort + '/' +
                 ein + '/' +
                 ein + '_' +
                 taxPeriod + '_990PF.pdf';
    el.attr('data-url-pdf', urlPDF);
    el.attr('href', urlPDF);
  }
});
