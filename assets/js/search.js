/* eslint-disable guard-for-in */
$(document).ready(function() {
  // Define search globals
  const targetEIN = $('h1.org-name').data('ein');
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');

  // INITIALIZATION
  // ==============

  // Replace with your own values
  const APPLICATION_ID = 'QA1231C5W9';
  const SEARCH_ONLY_API_KEY = 'cd47ecb3457441878399b20acc8c3fbc';
  const INDEX_NAME = 'grantmakers_io';
  let PARAMS = {
    'hitsPerPage': 15,
    'maxValuesPerFacet': 8,
    'facets': [],
    'disjunctiveFacets': ['tax_year', 'grantee_city', 'grantee_state'],
    'index': INDEX_NAME,
    'filters': 'ein:' + targetEIN,
  };
  let FACETS_SLIDER = [];
  let FACETS_ORDER_OF_DISPLAY = ['tax_year', 'grantee_state', 'grantee_city'];
  let FACETS_LABELS = {'tax_year': 'Tax Year', 'grantee_state': 'State', 'grantee_city': 'City'};

  // Client + Helper initialization
  const algolia = algoliasearch(APPLICATION_ID, SEARCH_ONLY_API_KEY);
  const algoliaHelper = algoliasearchHelper(algolia, INDEX_NAME, PARAMS);

  // DOM BINDING
  const $searchInput = $('#search-input');
  const $searchInputIcon = $('#search-input-icon');
  const $main = $('#grants');
  const $sortBySelect = $('#sort-by-select');
  const $hits = $('#hits');
  const $hitsModal = $('#hitsModal');
  const $stats = $('#stats');
  const $facets = $('#facets');
  const $clear = $('#clear');
  const $pagination = $('#pagination');
  const $rateLimit = $('#rate-limit');

  // Hogan templates binding
  const hitTemplate = Hogan.compile($('#hit-template').text());
  const hitModalTemplate = Hogan.compile($('#hit-modal-template').text());
  const statsTemplate = Hogan.compile($('#stats-template').text());
  const facetTemplate = Hogan.compile($('#facet-template').text());
  const sliderTemplate = Hogan.compile($('#slider-template').text());
  const clearTemplate = Hogan.compile($('#clear-template').text());
  const paginationTemplate = Hogan.compile($('#pagination-template').text());
  const noResultsTemplate = Hogan.compile($('#no-results-template').text());
  const rateLimitTemplate = Hogan.compile($('#rate-limit-template').text());

  // FORMATTING
  // ==========

  // Format numbers and currency
  let formatter = new Intl.NumberFormat('en-US', {
    'style': 'decimal',
    'minimumFractionDigits': 0,
  });

  // Hide footer tip on scroll
  $(window).scroll(function() {
    if ($(this).scrollTop() > 0) {
      $('#footer-alert').fadeOut();
    } else {
      $('#footer-alert').fadeIn();
    }
  });


  // SEARCH BINDING
  // ==============

  // Input binding
  $searchInput
    .on('input propertychange', function(e) {
      // var query = e.currentTarget.value.replace('-',''); //Handle EINs entered with a hyphen
      const query = e.currentTarget.value;
      if ($('#search-input').val().length > 0) {
        $searchInputIcon.html('close');
        // $('#stats ul li a').html('MOST RELEVANT');
      } else {
        $searchInputIcon.html('search');
        // $('#stats ul li a').html('MOST RECENT');
      }
      
      algoliaHelper.setQuery(query).search();
    });
  // .focus();

  // Search errors
  algoliaHelper.on('error', function(error) {
    console.log(error);
    if (error.statusCode === 429) {
      $('#stats').css('visibility', 'hidden');
      renderRateLimit();
      console.log('Rate limit reached');
    }
  });

  // Update URL
  algoliaHelper.on('change', function() {
    setURLParams();
  });

  // Search results
  algoliaHelper.on('result', function(content, state) {
    renderStats(content);
    renderHits(content);
    renderFacets(content, state);
    bindSearchObjects(state);
    renderPagination(content);
    handleNoResults(content);
    // console.log(content);
  });

  // Initial search
  initFromURLParams();
  algoliaHelper.search();


  // RENDER SEARCH COMPONENTS
  // ========================

  function renderStats(content) {
    let stats = {
      'nbHits': content.nbHits,
      'nbHits_plural': content.nbHits !== 1,
      'processingTimeMS': content.processingTimeMS,
    };
    $stats.html(statsTemplate.render(stats));

    if ($('#search-input').val().length > 0) {
      $('#stats ul li a').html('MOST RELEVANT');
    } else {
      $('#stats ul li a').html('MOST RECENT');
    }

    $('.format-number').each(function() {
      let n = $(this).text();
      let formattedNumber = formatter.format(n);
      $(this).text(formattedNumber);
    });
  }

  function renderHits(content) {
    $hits.html(hitTemplate.render(content));
    $hitsModal.html(hitModalTemplate.render(content));

    // Format EIN results
    $('.hit-ein').each(function() {
      let string = $(this).text();
      $(this).text(string.substring(0, 2) + '-' + string.substring(2, 9));
    });

    // Format Website results to provide proper href
    $('.hit-website').each(function() {
      let site = $(this).data('website');
           
      // Check if properly formatted url
      if (site && site.match(/(?:(?:https?):\/\/)/i)) {
        site = site;
        $(this).attr('href', site);
      } else {
        // Alert if malformed url
        $(this).removeAttr('href');
        $(this).bind('click', function() {
          alert(
            'Hmm, looks like the website url is not properly formatted.' +
            '\n\n' + site + '\n\n'
          );
        });
      }
    });

    // Format dollar amounts and currency figures
    $('.hit-format-currency').each(function() {
      let n = $(this).text();
      let formattedNumber = '$' + formatter.format(n);
      $(this).text(formattedNumber);
    });

    // Format numbers
    $('.hit-format-number').each(function() {
      let n = $(this).text();
      let formattedNumber = formatter.format(n);
      $(this).text(formattedNumber);
    });
  }


  function renderFacets(content, state) {
    let facetsHtml = '';
    for (let facetIndex = 0; facetIndex < FACETS_ORDER_OF_DISPLAY.length; ++facetIndex) {
      let facetName = FACETS_ORDER_OF_DISPLAY[facetIndex];
      let facetResult = content.getFacetByName(facetName);
      if (!facetResult) continue;
      let facetContent = {};

      // Slider facets
      if ($.inArray(facetName, FACETS_SLIDER) !== -1) {
        facetContent = {
          'facet': facetName,
          'title': FACETS_LABELS[facetName] || facetName,
        };
        facetContent.min = facetResult.stats.min;
        facetContent.max = facetResult.stats.max;
        facetContent.min = 0;
        facetContent.max = 1000000;
        let from = state.getNumericRefinement(facetName, '>=') || facetContent.min;
        let to = state.getNumericRefinement(facetName, '<=') || facetContent.max;
        facetContent.from = Math.min(facetContent.max, Math.max(facetContent.min, from));
        facetContent.to = Math.min(facetContent.max, Math.max(facetContent.min, to));
        facetsHtml += sliderTemplate.render(facetContent);
      } else {
        // Conjunctive + Disjunctive facets
        if (facetName === 'tax_year') {
          facetContent = {
            'facet': facetName,
            'title': FACETS_LABELS[facetName] || facetName,
            'values': content.getFacetValues(facetName, {'sortBy': ['name:desc']}),
            'disjunctive': $.inArray(facetName, PARAMS.disjunctiveFacets) !== -1,
          };
          facetsHtml += facetTemplate.render(facetContent);
          $clear.html(clearTemplate.render());
        } else {
          facetContent = {
            'facet': facetName,
            'title': FACETS_LABELS[facetName] || facetName,
            'values': content.getFacetValues(facetName, {'sortBy': ['isRefined:desc', 'count:desc']}),
            'disjunctive': $.inArray(facetName, PARAMS.disjunctiveFacets) !== -1,
          };
          facetsHtml += facetTemplate.render(facetContent);
          $clear.html(clearTemplate.render());
        }
      }
    }
    $facets.html(facetsHtml);
    $('[data-facet="Filings.TaxPeriod"] .facet-value').each(function() {
      let string = $.trim($(this).text());
      $(this).html(string.substring(0, 4) + '-' + string.substring(4, 6));
    });

    $('.format-number-facet').each(function() {
      let n = $(this).text();
      let formattedNumber = formatter.format(n);
      $(this).text(formattedNumber);
    });
  }

  function bindSearchObjects(state) {
    function createOnFinish(facetName) {
      return function onFinish(data) {
        let lowerBound = state.getNumericRefinement(facetName, '>=');
        lowerBound = lowerBound && lowerBound[0] || data.min;
        if (data.from !== lowerBound) {
          algoliaHelper.removeNumericRefinement(facetName, '>=');
          algoliaHelper.addNumericRefinement(facetName, '>=', data.from).search();
        }
        let upperBound = state.getNumericRefinement(facetName, '<=');
        upperBound = upperBound && upperBound[0] || data.max;
        if (data.to !== upperBound) {
          algoliaHelper.removeNumericRefinement(facetName, '<=');
          algoliaHelper.addNumericRefinement(facetName, '<=', data.to).search();
        }
      };
    }
    
    // Bind Sliders
    for (let facetIndex = 0; facetIndex < FACETS_SLIDER.length; ++facetIndex) {
      let facetName = FACETS_SLIDER[facetIndex];
      let slider = $('#' + facetName + '-slider');
      let sliderOptions = {
        'type': 'double',
        // values: [0, 1000000, 100000000, 1000000000, 50000000000],
        'grid': true,
        'min': slider.data('min'),
        'max': slider.data('max'),
        'from': slider.data('from'),
        'to': slider.data('to'),
        'keyboard': true,
        'keyboard_step': 0.5,
        'prettify_enabled': true,
        'prettify_separator': ',',
        'force_edges': true,
        'prefix': '$',
        'onFinish': createOnFinish(facetName),
      };
      slider.ionRangeSlider(sliderOptions);
    }
  }

  function renderPagination(content) {
    let pages = [];
    if (content.page > 3) {
      pages.push({'current': false, 'number': 1});
      pages.push({'current': false, 'number': '...', 'disabled': true});
    }
    for (let p = content.page - 3; p < content.page + 3; ++p) {
      if (p < 0 || p >= content.nbPages) continue;
      pages.push({'current': content.page === p, 'number': p + 1});
    }
    if (content.page + 3 < content.nbPages) {
      pages.push({'current': false, 'number': '...', 'disabled': true});
      pages.push({'current': false, 'number': content.nbPages});
    }
    let pagination = {
      'pages': pages,
      'prev_page': content.page > 0 ? content.page : false,
      'next_page': content.page + 1 < content.nbPages ? content.page + 2 : false,
    };
    $pagination.html(paginationTemplate.render(pagination));

    // Prevent default click behavior on disabled buttons
    $(document).on('click', 'ul.pagination li.disabled a', function(e) {
      e.preventDefault();
    });
  }

  function renderRateLimit(content) {
    $rateLimit.html(rateLimitTemplate.render(content));
  }


  // NO RESULTS
  // ==========

  function handleNoResults(content) {
    if (content.nbHits > 0) {
      $main.removeClass('no-results');
      return;
    }
    $main.addClass('no-results');

    let filters = [];
    let i;
    let j;
    for (i in algoliaHelper.state.facetsRefinements) {
      filters.push({
        'class': 'toggle-refine',
        'facet': i, 'facet_value': algoliaHelper.state.facetsRefinements[i],
        'label': FACETS_LABELS[i] + ': ',
        'label_value': algoliaHelper.state.facetsRefinements[i],
      });
    }
    for (i in algoliaHelper.state.disjunctiveFacetsRefinements) {
      for (j in algoliaHelper.state.disjunctiveFacetsRefinements[i]) {
        filters.push({
          'class': 'toggle-refine',
          'facet': i,
          'facet_value': algoliaHelper.state.disjunctiveFacetsRefinements[i][j],
          'label': FACETS_LABELS[i] + ': ',
          'label_value': algoliaHelper.state.disjunctiveFacetsRefinements[i][j],
        });
      }
    }
    for (i in algoliaHelper.state.numericRefinements) {
      for (j in algoliaHelper.state.numericRefinements[i]) {
        filters.push({
          'class': 'remove-numeric-refine',
          'facet': i,
          'facet_value': j,
          'label': FACETS_LABELS[i] + ' ',
          'label_value': j + ' ' + algoliaHelper.state.numericRefinements[i][j],
        });
      }
    }
    $hits.html(noResultsTemplate.render({'query': content.query, 'filters': filters}));
  }


  // EVENTS BINDING
  // ==============

  const scrollAnchor = $('.section-results').offset().top - 82;

  $searchInput.on('focusin', function(e) { // HACK Mobile Safari
    if (isMobile.matches) {
      e.preventDefault();
      e.stopPropagation();
      readyToSearchScrollPosition();
      $('.navbar-search').addClass('safari-scroll-hack');
    }
  });
  $searchInput.on('focusout', function(e) { // HACK Mobile Safari
    if (isMobile.matches) {
      e.preventDefault();
      e.stopPropagation();
      readyToSearchScrollPosition();
      $('.navbar-search').removeClass('safari-scroll-hack');
    }
  });
  $searchInput.on('input', function() {
    const page = $('html, body');
    if (!isMobile.matches) {
      page.on('scroll mousedown wheel DOMMouseScroll mousewheel touchmove', function() {
        page.stop();
      });
      readyToSearchScrollPosition();
      return false;
    } else {
      return true;
    }
  });
  $(document).on('click', '.toggle-refine', function(e) {
    e.preventDefault();
    algoliaHelper.toggleRefine($(this).data('facet'), $(this).data('value')).search();
  });
  $(document).on('click', '.go-to-page', function(e) {
    e.preventDefault();
    readyToSearchScrollPosition();
    algoliaHelper.setCurrentPage(+$(this).data('page') - 1).search();
  });
  $sortBySelect.on('change', function(e) {
    e.preventDefault();
    algoliaHelper.setIndex(INDEX_NAME + $(this).val()).search();
  });
  $searchInputIcon.on('click', function(e) {
    e.preventDefault();
    $searchInput.val('').keyup().focus();
    algoliaHelper.setQuery('').search();
    $searchInputIcon.html('search');
    readyToSearchScrollPosition();
  });
  $(document).on('click', '.remove-numeric-refine', function(e) {
    e.preventDefault();
    algoliaHelper.removeNumericRefinement($(this).data('facet'), $(this).data('value')).search();
  });
  $(document).on('click', '.clear-all', function(e) {
    e.preventDefault();
    $searchInput.val('').focus();
    $searchInputIcon.html('search');
    algoliaHelper.setQuery('').clearRefinements().search();
  });
  $(document).on('click', '.clear-search', function(e) {
    e.preventDefault();
    $searchInput.val('').focus();
    $searchInputIcon.html('search');
    algoliaHelper.setQuery('').search();
  });
  $(document).on('click', '.clear-refinements', function(e) {
    e.preventDefault();
    $searchInput.focus();
    $searchInputIcon.html('search');
    algoliaHelper.setQuery('').clearRefinements().search();
  });
  $(document).on('click', '.try-it li a', function(e) {
    e.preventDefault();
    let target = $(this).text();
    // $searchInput.val(target.replace('-','')); //Handle hyphen in EIN
    // algoliaHelper.setQuery(target.replace('-','')).search();
    $searchInput.val(target);
    algoliaHelper.setQuery(target).search();
    readyToSearchScrollPosition();
  });


  // URL MANAGEMENT
  // ==============

  function initFromURLParams() {
    let URLString = window.location.search.slice(1);
    let URLParams = algoliasearchHelper.url.getStateFromQueryString(URLString);
    let stateFromURL = Object.assign({}, PARAMS, URLParams);
    $searchInput.val(stateFromURL.query);
    $sortBySelect.val(stateFromURL.index.replace(INDEX_NAME, ''));
    algoliaHelper.overrideStateWithoutTriggeringChangeEvent(stateFromURL);
  }

  let URLHistoryTimer = Date.now();
  let URLHistoryThreshold = 700;
  function setURLParams() {
    let trackedParameters = ['attribute:*'];
    if (algoliaHelper.state.query.trim() !== '')  trackedParameters.push('query');
    if (algoliaHelper.state.page !== 0)           trackedParameters.push('page');
    if (algoliaHelper.state.index !== INDEX_NAME) trackedParameters.push('index');

    let URLParams = window.location.search.slice(1);
    let nonAlgoliaURLParams = algoliasearchHelper.url.getUnrecognizedParametersInQueryString(URLParams);
    let nonAlgoliaURLHash = window.location.hash;
    let helperParams = algoliaHelper.getStateAsQueryString({'filters': trackedParameters, 'moreAttributes': nonAlgoliaURLParams});
    if (URLParams === helperParams) return;

    let now = Date.now();
    if (URLHistoryTimer > now) {
      window.history.replaceState(null, '', '?' + helperParams + nonAlgoliaURLHash);
    } else {
      window.history.pushState(null, '', '?' + helperParams + nonAlgoliaURLHash);
    }
    URLHistoryTimer = now + URLHistoryThreshold;
  }

  window.addEventListener('popstate', function() {
    initFromURLParams();
    algoliaHelper.search();
  });


  // HELPER METHODS
  // ==============

  function readyToSearchScrollPosition() {
    if (!isMobile.matches) {
      $('html, body').animate({'scrollTop': scrollAnchor}, '500', 'swing');
    }
  }
});
