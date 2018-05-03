---
---
$(document).ready(function() {

  // Navbar
  // =======================================================
  const header = $('.header');
  const navbar = $('.navbar-profile');
  const range = 64;

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
      // $('.algolia-partnership-logo img').attr('src', '{{ site.baseurl}}/assets/img/algolia-partnership-logo.png');
    } else if ( calc < '0' ) {
      header.css({ 'opacity': 0 });
      navbar.addClass('affix');
      navbar.removeClass('affix-top');
      // $('.algolia-partnership-logo img').attr('src', '{{ site.baseurl}}/assets/img/algolia-partnership-logo-light.png');
    }

  });

  // Materialize components
  // =======================================================
  window.onload = function() {
    $('.sidenav').sidenav();
    $('.tooltipped').tooltip();
    $('.collapsible').collapsible({
      'accordion': false
    });

    $('.collapsible-grants-table').collapsible({
      'accordion': false,
      // TODO Use onOpenStart to add spinning icon
      // onOpenStart: function(el) {
      //   $(el).find('.collapsible-header i').addClass('md-spin');
      // }
      onOpenEnd: function(el) {
        $(el).find('.collapsible-header i').removeClass('md-spin');
      }
    });
    
    // TODO Use onOpenStart to add spinning icon
    // Unsure of root cause - possible Materialize bug?
    $('.collapsible-grants-table .collapsible-header').click(function(e) {
      if(!$(this).parent().hasClass('active')){
        e.stopPropagation();
        $(this).find('i').addClass('md-spin');
        $(this).find('i').removeClass('bounce');
        setTimeout(function() {
          $('.collapsible-grants-table').collapsible('open');
        }, 100);
      }
    });
  };

  // Fixed headers via Pushpin
  // Currently only on non-mobile devices with Algolia enabled
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');
  const hasAlgolia = $('#grants .card-panel-header .search');

  function enableGrantsFixedHeader() {
    const grantsHeader = $('#grants .card-panel-header');
    grantsHeader.addClass('pushpin-nav pushpin-nav-search');
    grantsHeader.attr('data-target', 'grants');
  }

  if (!isMobile.matches && hasAlgolia.length) {
    enableGrantsFixedHeader();
  }

  if ($('.pushpin-nav').length) {
    $('.pushpin-nav').each(function() {
      let $this = $(this);
      let $target = $('#' + $(this).attr('data-target'));
      let $id = $(this).attr('data-target');
      let targetBottom = 0;
      if ($id == 'main-nav') {
        targetBottom = $('#grants').offset().top - $('.pushpin-nav-search').height();
      } else {
        // TODO Fix hard-coded hack
        targetBottom = $target.offset().top + 1000;

      }
      $this.pushpin({
        top: $target.offset().top,
        bottom: targetBottom
      });
    });
  }

  // SMOOTH SCROLL
  // =======================================================
  $('ul.profile-summary-icons li a.scrolly').on('click', function(e) {
    e.preventDefault();
    scrolly(this);
  });

  $('.nav-primary li a.scrolly').on('click', function(e) {
    e.preventDefault();
    // collapse mobile header
    if (isMobile) {
      $('.sidenav').sidenav('close');
    }

    scrolly(this);

    // google analytics
    var text = $(this).text();
    ga('send', 'event', {
      'eventCategory': 'Profile Events',
      'eventAction': 'Profile Header Click',
      'eventLabel': text,
    });
  });

  function scrolly(elem) {
    // store hash
    let hash = elem.hash;

    // animate
    $('html, body').animate({
      'scrollTop': $(elem.hash).offset().top - 120,
    }, 300, function() {
      // when done, add hash to url
      // (default click behaviour)
      window.location.hash = hash;
    });
  }

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
    M.toast({
      html: 'Redirecting to latest 990...'
    })
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
        M.Toast.dismissAll();
        M.toast({
          html: 'PDF not yet available. Try a prior year.'
        });
      }
    })
    .fail(function(xhr, textStatus, error){
      var toastContent = '<span>Something went wrong.</span><button href="http://foundationcenter.org/find-funding/990-finder" class="btn-flat toast-action">Try Here.</button>';
      M.Toast.dismissAll();
      M.toast({
        html: toastContent, 
        displayLength: 10000
      });
    });
  });
});
