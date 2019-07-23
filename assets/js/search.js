---
---
$(document).ready(function() {
  'use strict';
  // Helper definitions
  // =======================================================
  const targetEIN = $('h1.org-name').data('ein');
  const targetTaxYearOnlyOne = $('h1.org-name').data('tax-year-only-one'); // resolves to boolean true or false
  const scrollAnchor = $('#grants').offset().top - 64; // 64 is height of profile-nav
  // const isPhone = window.matchMedia('only screen and (max-width: 600px)');
  // const isMobile = window.matchMedia('only screen and (max-width: 992px)');
  let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
  let gaCount = 0;

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
      facet: 'grantee_name',
      label: 'Recipient',
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
            'grantee_name':
              refinementList &&
              refinementList.grantee_name &&
              refinementList.grantee_name.join('~'),
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
              'grantee_name': routeState.grantee_name && routeState.grantee_name.split('~'),
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
        <table class="striped ais-hits-table">
          <thead>
            <tr>
              <th class="text-nowrap"><span>Amount</span></th>
              <th><span>Name</span></th>
              <th><span>Purpose</span></th>
              <th><span>Location</span></th>
              <th><span>Year</span></th>
            </tr>
          </thead>
          <tbody>
            ${hits.map(item =>`
              <tr>
                <td class="right-align" data-facet="grant_amount" data-facet-value="${ item.grant_amount }">$${ item.grant_amount.toLocaleString() }</td>
                <td data-facet="grantee_name" data-facet-value="${ item.grantee_name }">${ instantsearch.highlight({ attribute: 'grantee_name', hit: item }) }</td>
                <td data-facet="grant_purpose" data-facet-value="${ item.grant_purpose }">${ instantsearch.highlight({ attribute: 'grant_purpose', hit: item }) }</td>
                <td class="no-wrap" data-facet="grantee_city" data-facet-value="${ item.grantee_city }">${ item.grantee_city.length ? instantsearch.highlight({ attribute: 'grantee_city', hit: item }) + ',&nbsp;' + item.grantee_state : item.grantee_state}</td>
                <td data-facet="tax_year" data-facet-value="${ item.tax_year }">${ item.tax_year }</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      document.querySelectorAll('#ais-widget-hits td')
        .forEach(e => e.addEventListener('click', refineIfTableItemClicked));
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

  /* RefinementList - Tax Year Toggle */
  const renderRefinementList = (renderOptions) => {
    const { items, refine, widgetParams } = renderOptions;

    widgetParams.container.innerHTML = `
      <ul id="tax-year-dropdown" class="dropdown-content">
        ${items.map(item => `
          <li data-value="${item.value}">
            <label>
              <input type="checkbox" class="filled-in" ${item.isRefined ? 'checked="checked"' : ''} ${targetTaxYearOnlyOne ? 'disabled="disabled"' : ''} value="${item.value}"/>
              <span class="ais-RefinementList-labelText">${item.label}</span>
              <span class="ais-RefinementList-count right small">${item.count}</span>
            </label>
          </li>
        `).join('')}
      </ul>
    `;

    // Only enable click events and dropdown if multiple tax years exist
    if (!targetTaxYearOnlyOne) {
      // Initialize Materialize dropdown plugin
      reInitDropdown();
      // Create click events to allow Algolia to refine
      [...widgetParams.container.querySelectorAll('li')].forEach(element => {
        element.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          refine(event.currentTarget.dataset.value);
        });
      });
    }
  };

  const customRefinementList = instantsearch.connectors.connectRefinementList(
    renderRefinementList
  );

  search.addWidget(
    customRefinementList({
      'container': document.querySelector('#ais-widget-refinement-list--tax_year'),
      'attribute': 'tax_year',
      'limit': 8,
      'sortBy': ['isRefined', 'name:desc'],
    })
  );
  
  
  /* Refinements */
  facets.forEach((refinement) => {
    let sortBy = ['isRefined', 'count:desc', 'name:asc'];
    // Amount handled by range widget
    if (refinement.facet === 'grant_amount') {
      return;
    }
    // Sorting by year, not count, makes more sense w/ Tax Years
    if (refinement.facet === 'tax_year') {
      sortBy = ['isRefined', 'name:desc', 'count:desc'];
    }

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

    // On desktop, tax year uses custom widget
    if (refinement.facet === 'tax_year') {
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
        'limit': 5,
        'showMore': true,
        'sortBy': sortBy,
        // 'searchable': true,
        'cssClasses': {
          'checkbox': 'filled-in',
          'labelText': 'small',
          'count': ['right', 'small'],
          'showMore': ['btn-flat', 'btn-small'],
          'disabledShowMore': ['disabled'],
          // 'selectedItem': ['grants-search-text'],
          // 'searchableRoot': 'ais-SearchBox-refinements',
          // 'searchableSubmit': 'hidden',
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
        <button class="waves-effect btn blue-grey lighten-3 grey-text text-darken-3" ${createDataAttribtues(refinement)}><i class="material-icons right">remove_circle</i><small>${getLabel(item.label)}</small> ${formatIfRangeLabel(refinement)} </button>
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
    hideSeoPlaceholders();
    showSortByDropdown();
  });

  // search.on('render', function() {

  search.on('error', function(e) {
    if (e.statusCode === 429) {
      renderRateLimit();
      console.log('Rate limit reached');
    }
    if (e.statusCode === 403) {
      renderForbidden();
      console.log('Origin forbidden');
    }
    // console.log(e);
  });

  // Scroll to top upon input change
  // =======================================================
  function readyToSearchScrollPosition() {
    $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
  }

  // Materialize - initialize tax year dropdown
  function reInitDropdown() {
    const elems = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(elems, {'container': 'ais-widget-refinement-list--tax_year'});
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

  // FETCH GRANTS JSON
  // =======================================================
  /*
  const grantsURL = '{{ site.baseurl }}/' + targetEIN + '/grants/';
  function fetchGrants(url, callback) {
    let req = new XMLHttpRequest();
  
    req.addEventListener('load', onLoad);
    req.addEventListener('error', onFail);
    req.addEventListener('abort', onFail);
  
    req.open('GET', url);
    req.send();
  
    function onLoad(event) {
      if (req.status >= 400) {
        onFail(event);
      } else {
        const json = JSON.parse(this.responseText);
        callback(null, json);
      }
    }
  
    function onFail(event) {
      callback(new Error('...'));
    }
  }
  */

  // Helper functions
  // =======================================================
  function hideSeoPlaceholders() {
    const target = document.getElementById('ais-widget-refinement-list--seo-placeholder');
    target.classList.add('hidden');
  }

  function showSortByDropdown() {
    const el = document.getElementById('ais-widget-sort-by');
    const trigger = el.querySelector('a.dropdown-trigger');
    el.classList.remove('hidden');
    // Check if only one tax year exists
    // and disable clicks to prevent confusion
    if (targetTaxYearOnlyOne) {
      trigger.classList.add('disabled');
      trigger.addEventListener('click', function() {
        M.Toast.dismissAll();
        M.toast({
          'html': 'No filters available for Tax Year',
          'displayLength': 4000,
        });
      });
    }
  }

  function scrolly(elem) {
    let position = $(elem).position().top;
    // animate
    $('html, body').animate({
      scrollTop: position + 100,
    }, 300, function() {
    });
  }

  function refineIfTableItemClicked(e) {
    const elem = e.target.closest( 'td' );
    const facet = elem.dataset.facet;
    let value = elem.dataset.facetValue;

    let valueMax;
    let valueMin;
    const amountBuffer = 0.2; // Percent above and below, in decimal format

    let tooltip;
    // TODO How to incorporate grant_purpse
    // TODO How to incorporate amount
    // console.log('Initial Helper state');
    // console.log(search.helper.state);

    // Define tooltip message
    switch (facet) {
    case 'grantee_name':
    case 'tax_year':
      tooltip = 'Added filter';
      break;
    case 'grantee_city':
      tooltip = 'Added filter (City)';
      break;
    case 'grant_purpose':
      // tooltip = 'Sorry, unable to filter by grant purpose at this time';
      tooltip = 'Searching for "' + value + '"';
      break;
    case 'grant_amount':
      tooltip = 'Added 20 percent buffer to selection';
      break;
    default:
      // TODO Needs to be more generalized as refinement is toggled
      // e.g. can be added or removed
      tooltip = 'Added filter';
    }
    if (facet !== 'grant_amount' && facet !== 'grant_purpose') {
      console.log('Clicked anything other than amount or purpose');
      // console.log(search.helper);
      search.helper.toggleFacetRefinement(facet, value).search();
    } else if (facet === 'grant_amount') {
      value = Number(value);
      valueMax = Math.round(value * (1 + amountBuffer));
      valueMin = Math.round(value * (1 - amountBuffer));
      console.log(valueMax);
      console.log(valueMin);
      search.helper.addNumericRefinement(facet, '=', value).search();
      // search.helper.addNumericRefinement(facet, '<=', valueMax).search();
      // search.helper.addNumericRefinement(facet, '>=', valueMin).search();
    } else if (facet === 'grant_purpose') {
      search.helper.setQuery(value).search();
    } else {
      console.log('Detected click, but target is not a disjunctive Facet');
    }

    readyToSearchScrollPosition();
    
    // TODO Disable "most" if scrolling to default position
    M.Toast.dismissAll();
    M.toast({
      'html': tooltip,
      'displayLength': 2000,
    });
  }

  /*
  function disabledShowMoreMessage() {
    // Only need to call once, thus, place in search.once
    document.getElementById('ais-widget-refinements').addEventListener('click', function(e) {
      if (e.target && e.target.querySelector('button.ais-RefinementList-showMore--disabled')) {
        M.Toast.dismissAll();
        M.toast({
          'html': 'Nothing more to show',
          'displayLength': 1000,
        });
      }
    });
  }
  */

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
