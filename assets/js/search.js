---
---
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
  const searchClient = algoliasearch('QA1231C5W9', '{{ site.algolia_public_key_grants }}');
  const facets = [
    {
      facet: 'tax_year',
      label: 'Tax Year',
    },
    {
      facet: 'grantee_city',
      label: 'City',
    },
    {
      facet: 'grantee_state',
      label: 'State',
    },
    {
      facet: 'grant_amount',
      label: 'Amount',
    },
  ];
  const search = instantsearch({
    'indexName': 'grantmakers_io',
    searchClient,
    'numberLocale': 'en-US',
    'searchParameters': {
      'filters': 'ein:' + targetEIN,
    },
    // routing: true,
    'routing': {
      'stateMapping': {
        stateToRoute({query, refinementList, range, page}) {
          return {
            'query': query,
            'tax_year':
              refinementList &&
              refinementList.tax_year &&
              refinementList.tax_year.join('~'),
            'grantee_city':
              refinementList &&
              refinementList.grantee_city &&
              refinementList.grantee_city.join('~'),
            'grantee_state':
              refinementList &&
              refinementList.grantee_state &&
              refinementList.grantee_state.join('~'),
            'grant_amount':
              range &&
              range.grant_amount &&
              range.grant_amount.replace(':', '~'),
            'page': page,
          };
        },
        /* eslint-disable camelcase */
        routeToState(routeState) {
          return {
            'query': routeState.query,
            'refinementList': {
              'tax_year': routeState.tax_year && routeState.tax_year.split('~'),
              'grantee_city': routeState.grantee_city && routeState.grantee_city.split('~'),
              'grantee_state': routeState.grantee_state && routeState.grantee_state.split('~'),
            },
            'range': {
              'grant_amount': routeState.grant_amount && routeState.grant_amount.replace('~', ':'),
            },
            'page': routeState.page,
          };
        },
      },
    },
  });
  /* eslint-enable camelcase */

  // Define templates
  const templateStats = `{% include algolia/stats.html %}`;

  // Define color palette
  const panelHeaderClasses = ['card-header', 'grey', 'lighten-4'];
  const panelHeaderClassesMobile = ['card-header', 'blue-grey', 'lighten-4'];

  // Construct widgets
  // =======================================================
  search.addWidget(
    instantsearch.widgets.searchBox({
      container: '#ais-widget-search-box',
      placeholder: 'Search by keyword or recipient name',
      autofocus: false,
      reset: true,
      queryHook: function(query, searchInstance) {
        readyToSearchScrollPosition();
        searchInstance(query);
        gaEvents();
      },
    })
  );

  /* Stats */
  search.addWidget(
    instantsearch.widgets.stats({
      container: '#ais-widget-stats',
      templates: {
        text: templateStats,
      },
      cssClasses: {
        root: 'center-align-on-mobile',
        text: ['text-muted', 'hide-on-med-and-down'],
      },
    })
  );

  /* Hits */
  const renderHits = (renderOptions) => {
    const { hits, results, widgetParams } = renderOptions;

    if (!hits.length && results) {
      document.getElementById('ais-widget-pagination').classList.add('hidden');
      widgetParams.container.innerHTML = `
        <div class="hits-empty">
          <div class="card">
            <div class="card-content">
              {% raw %}
                <p></p>
                <p>We didn't find any results for the search <strong>"${ results.query }"</strong></p>
              {% endraw %}
            </div>
          </div>
          <div class="card-actions">
            <a href="{{ site.url }}/search/profiles/" class="btn-flat grantmakers-text">Find a Different Foundation</a>
            <a href="{{ site.url }}/search/grants/" class="btn-flat blue-grey-text">Search all Grants</a>
          </div>
        </div>
      `;
    } else {
      document.getElementById('ais-widget-pagination').classList.remove('hidden');
      widgetParams.container.innerHTML = `
      <table class="striped">
        <thead>
          <tr>
            <th><span>Year</span></th>
            <th><span>Name</span></th>
            <th><span>Purpose</span></th>
            <th><span>Location</span></th>
            <th class="text-nowrap right-align"><span>Amount</span></th>
          </tr>
        </thead>
        <tbody>
          ${hits.map(item =>`
            <tr>
              <td>${ item.tax_year }</td>
              <td>${ instantsearch.highlight({ attribute: 'grantee_name', hit: item }) }</td>
              <td>${ instantsearch.highlight({ attribute: 'grant_purpose', hit: item }) }</td>
              <td class="no-wrap">${ item.grantee_city.length ? instantsearch.highlight({ attribute: 'grantee_city', hit: item }) + ',&nbsp;' + item.grantee_state : item.grantee_state}</td>
              <td class="right-align">$${ item.grant_amount.toLocaleString() }</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    }
  };

  const customHits = instantsearch.connectors.connectHits(
    renderHits
  );

  search.addWidget(
    customHits({
      container: document.querySelector('#ais-widget-hits'),
    })
  );

  /* Refinements */
  facets.forEach((refinement) => {
    if (refinement.facet === 'grant_amount') {
      return;
    }
    /* Desktop */
    const refinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement.label,
      },
      hidden(options) {
        return options.results.nbHits === 0;
      },
      'cssClasses': {
        'root': 'card',
        'header': panelHeaderClasses,
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);

    search.addWidget(
      refinementListWithPanel({
        'container': `#ais-widget-refinement-list--${refinement.facet}`,
        'attribute': refinement.facet,
        'limit': 8,
        'showMore': false,
        // 'searchable': true,
        'cssClasses': {
          'checkbox': 'filled-in',
          'labelText': 'small',
          'count': ['right', 'small'],
          // 'selectedItem': ['grants-search-text'],
          // 'searchableRoot': 'ais-SearchBox-refinements',
          // 'searchableSubmit': 'hidden',
        },
      })
    );

    /* Mobile */
    const mobileRefinementListWithPanel = instantsearch.widgets.panel({
      'templates': {
        'header': refinement.label,
      },
      hidden(options) {
        return options.results.nbHits === 0;
      },
      'cssClasses': {
        'root': 'card',
        'header': panelHeaderClassesMobile,
        'body': 'card-content',
      },
    })(instantsearch.widgets.refinementList);

    search.addWidget(
      mobileRefinementListWithPanel({
        'container': `#ais-widget-mobile-refinement-list--${refinement.facet}`,
        'attribute': refinement.facet,
        'limit': 8,
        'showMore': false,
        'cssClasses': {
          'checkbox': 'filled-in',
          'count': ['right', 'small'],
          'selectedItem': ['grantmakers-text'],
        },
      })
    );
  });

  const rangeSliderWithPanel = instantsearch.widgets.panel({
    'templates': {
      'header': 'Amount',
    },
    hidden(options) {
      return options.results.nbHits === 0;
    },
    'cssClasses': {
      'root': 'card',
      'header': panelHeaderClasses,
      'body': 'card-content',
    },
  })(instantsearch.widgets.rangeSlider);

  /* Range Slider */
  search.addWidget(
    rangeSliderWithPanel({
      container: '#ais-widget-range-slider',
      attribute: 'grant_amount',
      cssClasses: {
        tooltip: 'small',

      },
      tooltips: {
        format: function(rawValue) {
          return `$${numberHuman(rawValue, 0)}`;
        },
      },
      pips: false,
    })
  );

  /* Current Refinements */
  const createDataAttribtues = refinement =>
    Object.keys(refinement)
      .map(key => `data-${key}="${refinement[key]}"`)
      .join(' ');

  const renderListItem = item => `
    ${item.refinements.map(refinement => `
      <li>
        <button class="waves-effect btn blue-grey lighten-3 grey-text text-darken-3" ${createDataAttribtues(refinement)}><i class="material-icons right">remove_circle</i><small>${getLabel(item.label)}:</small> ${formatIfRangeLabel(refinement)} </button>
      </li>
    `).join('')}
  `;

  const renderCurrentRefinements = (renderOptions) => {
    const { items, refine, widgetParams } = renderOptions;

    widgetParams.container.innerHTML = `<ul class="list list-inline">${items.map(renderListItem).join('')}</ul>`;

    [...widgetParams.container.querySelectorAll('button')].forEach(element => {
      element.addEventListener('click', event => {
        const item = Object.keys(event.currentTarget.dataset).reduce(
          (acc, key) => ({
            ...acc,
            [key]: event.currentTarget.dataset[key],
          }),
          {}
        );

        refine(item);
      });
    });
  };

  const customCurrentRefinements = instantsearch.connectors.connectCurrentRefinements(
    renderCurrentRefinements
  );

  search.addWidget(
    customCurrentRefinements({
      container: document.querySelector('#ais-widget-current-refined-values'),
    })
  );

  /* Clear Refinements */
  search.addWidget(
    instantsearch.widgets.clearRefinements({
      container: '#ais-widget-clear-all',
      templates: {
        resetLabel: 'Clear filters',
      },
      cssClasses: {
        button: ['btn', 'btn-custom', 'waves-effect', 'waves-light', 'white-text'],
      },
    })
  );

  /* Pagination */
  search.addWidget(
    instantsearch.widgets.pagination({
      container: '#ais-widget-pagination',
      scrollTo: '#grants-scroll-anchor', // #grants used in v2
      cssClasses: {
        root: 'pagination',
        page: 'waves-effect',
        selectedItem: ['active', 'grey'],
        disabledItem: 'disabled',
      },
    })
  );

  // Clear refinements button - mobile
  search.addWidget(
    instantsearch.widgets.clearRefinements({
      container: '#ais-widget-mobile-clear-all',
      cssClasses: {
        button: ['waves-effect', 'waves-light', 'btn', 'btn', 'grey', 'lighten-5', 'grey-text', 'text-darken-3'],
      },
      templates: {
        resetLabel: 'Clear',
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

  search.on('error', function(e) {
    if (e.statusCode === 429) {
      renderRateLimit();
      console.log('Rate limit reached');
    }
    if (e.statusCode === 403) {
      renderForbidden();
      console.log('Origin forbidden');
    }
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

  function renderRateLimit() {
    const message = document.getElementById('rate-limit-message');
    message.classList.remove('hidden');

    const results = document.getElementById('algolia-hits-wrapper');
    results.classList.add('hidden');
  }

  function renderForbidden() {
    const message = document.getElementById('forbidden-message');
    message.classList.remove('hidden');

    const results = document.getElementById('algolia-hits-wrapper');
    results.classList.add('hidden');
  }

  function getLabel(item) {
    const obj = facets.filter(each => each.facet === item);
    return obj[0].label;
  }

  function formatIfRangeLabel(refinement) {
    if (refinement.attribute !== 'grant_amount') {
      return refinement.label;
    } else {
      return `${refinement.operator} $${numberHuman(refinement.value)}`;
    }
  }


  function numberHuman(num, decimals) {
    if (num === null) { return null; } // terminate early
    if (num === 0) { return '0'; } // terminate early
    if (isNaN(num)) { return num; } // terminate early if already a string - handles edge case likely caused by cacheing
    const fixed = !decimals || decimals < 0 ? 0 : decimals; // number of decimal places to show
    const b = num.toPrecision(2).split('e'); // get power
    const k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3); // floor at decimals, ceiling at trillions
    const c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed); // divide by power
    const d = c < 0 ? c : Math.abs(c); // enforce -0 is 0
    const e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }
});
