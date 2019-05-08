---
---
/* eslint quote-props: ["error", "as-needed"] */
$(document).ready(function() {
  'use strict';
  // Helper definitions
  // =======================================================
  const targetEIN = $('h1.org-name').data('ein');
  const scrollAnchor = $('#grants').offset().top - 64; // 64 is height of profile-nav
  const isPhone = window.matchMedia('only screen and (max-width: 600px)');
  // const isMobile = window.matchMedia('only screen and (max-width: 992px)');
  let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
  let gaCount = 0;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
  });
  // Note - fixed grants header handled by profile.js

  // Initialize Materialize components
  // =======================================================
  // Note: if the element is created dynamically via Instantsearch widget,
  // the plugin needs to be initialized in the normal Instantsearch workflow
  // using the render method (e.g. search.once('render'...)
  $('.parallax').parallax();
  $('.sidenav').sidenav();

  // Algolia Instantsearch
  // =======================================================
  // Config
  const search = instantsearch({
    appId: 'QA1231C5W9',
    apiKey: 'cd47ecb3457441878399b20acc8c3fbc',
    indexName: 'grantmakers_io',
    numberLocale: 'en-US',
    routing: true,
    searchParameters: {
      filters: 'ein:' + targetEIN,
    },
  });

  // Define templates
  const templateHits = `{% include algolia/hits.html %}`;
  const templateHitsEmpty = `{% include algolia/hits-empty.html %}`;
  const templateRefinementItem = `{% include algolia/refinement-item.html %}`;
  const templateRefinementHeader = `{% include algolia/refinement-header.html %}`;
  const templateCurrentRefinedValues = `{% include algolia/current-refined-values.html %}`;
  const templateShowMoreActive = `{% include algolia/show-more-active.html %}`;
  const templateShowMoreInactive = `{% include algolia/show-more-inactive.html %}`;

  // Define color palette
  const widgetHeaderClasses = ['card-header', 'grey', 'lighten-4'];

  // Construct widgets
  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#ais-widget-search-box',
      poweredBy: false,
      autofocus: false,
      reset: true,
      queryHook: function(query, searchInstance) {
        readyToSearchScrollPosition();
        searchInstance(query);
        gaEvents();
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.stats({
      container: '#ais-widget-stats',
      autoHideContainer: false,
      cssClasses: {
        body: 'center-align-on-mobile',
        time: 'small text-muted-max hide-on-med-and-down',
      },
    })
  );

  /*
  search.addWidget(
    instantsearch.widgets.sortBySelector({
      container: '#ais-widget-sort-by',
      cssClasses: {
        root: 'input-field',
        select: '',
        item: ''
      },
      indices: [
        {name: 'grantmakers_io', label: 'Most relevant'},
        // {name: 'demo_amount_desc', label: 'Grant size'},
      ]
    })
  );
  */

  // TODO Use infiniteHits template if isMobile.matches (aka on mobile devices)
  search.addWidget(
    instantsearch.widgets.hits({
      container: '#ais-widget-hits',
      templates: {
        empty: templateHitsEmpty,
        allItems: templateHits,
      },
      transformData: {
        empty: function(arr) {
          // Handle edge case
          // E.g. https://grantmakers.io/profiles/v0/136114244-pulvermacher-family-foundation-inc-co-jo-k-pulvermacher/?query=ho&refinementList%5Btax_year%5D%5B0%5D=2016&refinementList%5Btax_year%5D%5B1%5D=2015
          // See diff when searching for 'hi' and 'ho'
          const check = arr._rawResults[1];
          if (check && check.nbHits !== 0) {
            $('.section-clear-all').removeClass('no-hits');
          } else {
            $('.section-clear-all').addClass('no-hits');
          }
          return arr;
        },
        allItems: function(arr) {
          // Handle edge case (as per 'empty')
          $('.section-clear-all').removeClass('no-hits');
          // Change sort-by text
          for (let i = 0, len = arr.hits.length; i < len; i++) {
            let n = arr.hits[i].grant_amount;
            let formattedNumber = '$' + formatter.format(n);
            arr.hits[i].grant_amount = formattedNumber;
          }
          return arr;
        },
      },
    })
  );

  /*
  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-refinement-list--purpose',
      attributeName: 'grant_purpose',
      limit: 5,
      collapsible: {
        collapsed: true
      },
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      templates: {
        header: 'Program' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      }
    })
  );
  */

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-refinement-list--tax_year',
      attributeName: 'tax_year',
      sortBy: ['name:desc'],
      limit: 7,
      collapsible: {
        collapsed: false,
      },
      showMore: false,
      /*
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      */
      templates: {
        header: 'Tax Year' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-refinement-list--grantee_state',
      attributeName: 'grantee_state',
      limit: 7,
      collapsible: {
        collapsed: false,
      },
      showMore: false,
      /*
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      */
      templates: {
        header: 'State' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-refinement-list--grantee_city',
      attributeName: 'grantee_city',
      limit: 7,
      collapsible: {
        collapsed: false,
      },
      showMore: false,
      /*
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      */
      templates: {
        header: 'City' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.rangeSlider({
      container: '#ais-widget-range-slider',
      attributeName: 'grant_amount',
      collapsible: {
        collapsed: true,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      templates: {
        header: 'Amount' + templateRefinementHeader,
      },
      tooltips: {
        format: function(rawValue) {
          return '$' + Math.round(rawValue).toLocaleString();
        },
      },
      pips: false,
    })
  );

  search.addWidget(
    instantsearch.widgets.currentRefinedValues({
      container: '#ais-widget-current-refined-values',
      clearAll: false,
      clearsQuery: true,
      onlyListedAttributes: true,
      attributes: [
        // {name: 'grant_purpose', label: 'Program'},
        {name: 'tax_year', label: 'Tax Year'},
        {name: 'grantee_state', label: 'State'},
        {name: 'grantee_city', label: 'City'},
      ],
      cssClasses: {
        link: ['waves-effect', 'btn', 'btn-custom', 'btn-clear-refinements', 'blue-grey', 'lighten-3'],
        clearAll: ['waves-effect', 'btn', 'btn-custom', 'btn-clear-refinements white-text'],
      },
      templates: {
        item: templateCurrentRefinedValues,
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.clearAll({
      container: '#ais-widget-clear-all',
      templates: {
        link: 'Clear all',
      },
      autoHideContainer: true,
      clearsQuery: true,
      cssClasses: {
        root: ['btn', 'btn-custom', 'waves-effect', 'waves-light', 'white-text'],
      },
    })
  );

  // TODO remove pagination on mobile when infiniteHits widgets is used
  search.addWidget(
    instantsearch.widgets.pagination({
      container: '#ais-widget-pagination',
      padding: 1,
      autoHideContainer: true,
      // maxPages: 100, //TODO Algolia limits results to 1000 - thus 50 pages max
      scrollTo: '#grants',
      cssClasses: {
        root: 'pagination',
        page: 'waves-effect',
        active: 'active',
        disabled: 'disabled',
      },
    })
  );

  // Recreate refinement widgets for mobile views
  // Clear all button
  search.addWidget(
    instantsearch.widgets.clearAll({
      container: '#ais-widget-mobile-clear-all',
      templates: {
        link: '<a class="waves-effect waves-light btn btn grey lighten-5 grey-text text-darken-3">Clear</a>',
      },
      autoHideContainer: true,
      clearsQuery: true,
    })
  );
  // Slide out
  /*
  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-mobile-refinement-list--purpose',
      attributeName: 'grant_purpose',
      autoHideContainer: false,
      limit: 5,
      collapsible: {
        collapsed: false
      },
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      templates: {
        header: 'Program' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      }
    })
  );
  */

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-mobile-refinement-list--tax_year',
      attributeName: 'tax_year',
      autoHideContainer: false,
      sortBy: ['name:desc'],
      limit: 5,
      collapsible: {
        collapsed: false,
      },
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      templates: {
        header: 'Tax Year' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-mobile-refinement-list--grantee_state',
      attributeName: 'grantee_state',
      autoHideContainer: false,
      limit: 5,
      collapsible: {
        collapsed: true,
      },
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      templates: {
        header: 'State' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      },
    })
  );

  search.addWidget(
    instantsearch.widgets.refinementList({
      container: '#ais-widget-mobile-refinement-list--grantee_city',
      attributeName: 'grantee_city',
      autoHideContainer: false,
      limit: 5,
      collapsible: {
        collapsed: true,
      },
      showMore: {
        templates: {
          active: templateShowMoreActive,
          inactive: templateShowMoreInactive,
        },
      },
      templates: {
        header: 'City' + templateRefinementHeader,
        item: templateRefinementItem,
      },
      cssClasses: {
        header: widgetHeaderClasses,
        body: 'card-content',
      },
      transformData: function(item) {
        return formatRefinements(item);
      },
    })
  );

  // Initialize search
  search.start();

  // Initialize Materialize JS components
  // =======================================================
  search.once('render', function() {
    $('select').formSelect();
    reInitPushpin();
    showTableHeaderToast();
  });

  // Scroll to top upon input change
  // =======================================================
  function readyToSearchScrollPosition() {
    $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
  }

  // Re-init grants header pushpin
  // =======================================================
  function reInitPushpin() {
    const target = $('.pushpin-nav-search');
    if (target.length) {
      target.pushpin({
        top: $('#grants').offset().top,
        bottom: $('#grants').offset().top + $('#grants').height() - target.height(),
        offset: 64,
      });
    }
  }

  // GA Events
  // =======================================================
  function gaEvents() {
    if (typeof gaCheck === 'function' && gaCount === 0) {
      ga('send', 'event', {
        eventCategory: 'Profile Events',
        eventAction: 'Profile Search Focus',
        eventLabel: 'Grants search',
      });
    }
    gaCount++;
  }

  // Temp solution for table header clicks
  // =======================================================
  function showTableHeaderToast() {
    $('.ais-hits th span').click(function() {
      if (typeof gaCheck === 'function') {
        ga('send', 'event', {
          eventCategory: 'Profile Events',
          eventAction: 'Profile Table Attempted Sort Click',
          eventLabel: $(this).find('span').text(),
        });
      }
      let toastHTML;
      if (isPhone.matches) {
        toastHTML = '<span>Sorting available for current year only </span><button class="btn-flat toast-action js-toast-action-scroll">GO</button>';
      } else {
        toastHTML = '<span>Sorting available for current year only </span><button class="btn-flat toast-action js-toast-action-scroll">Try It</button>';
      }
      M.toast({
        html: toastHTML,
        displayLength: 4000,
      });
      const targetElem = $('#current-year-list-view');
      $('.js-toast-action-scroll').click(function() {
        scrolly(targetElem);
        $('.collapsible-header i').addClass('bounce');
      });
    });
  }

  // Helper functions
  // =======================================================
  function scrolly(elem) {
    let position = $(elem).position().top;
    // animate
    $('html, body').animate({
      scrollTop: position + 100,
    }, 300, function() {
    });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function randomId() {
    return Math.random()
      .toString(36)
      .substr(2, 10);
  }

  /*
  function formatNumbersOnly(item) {
    // Format numbers
    let n = item.grant_amount;
    let formattedNumber = formatter.format(n);
    item.grant_amount = formattedNumber;
    return item;
  }
  */

  function formatRefinements(item) {
    // Format numbers
    let n = item.count;
    let formattedNumber = formatter.format(n);
    item.count = formattedNumber;
    // Ensure css IDs are properly formatted and unique
    if (item.label) {
      item.cssId = 'id-' + slugify(item.label);
    } else {
      // Fallback
      item.cssId = 'id-' + randomId();
    }
    return item;
  }
});
