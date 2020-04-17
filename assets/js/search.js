---
---
$(document).ready(function() {
  'use strict';
  // Helper definitions
  // =======================================================
  const targetEIN = document.querySelector('h1.org-name').dataset.ein;
  const targetOrgName = document.querySelector('h1.org-name').dataset.name;
  const targetTaxYearOnlyOne = document.querySelector('h1.org-name').dataset.taxYearOnlyOne === 'true'; // resolves to boolean true or false
  // Scroll helpers
  const scrollBuffer = 65; // Height of profile-nav is 64px TODO Parts of nav are actually 65
  const scrollAnchorEl = document.getElementById('grants');
  const scrollAnchor = getElementOffset(scrollAnchorEl).top - scrollBuffer;
  let renderCount = 0;
  const throttle = (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => {inThrottle = false;}, limit);
      }
    };
  };
  
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
  const elemsSN = document.querySelectorAll('.sidenav');
  M.Sidenav.init(elemsSN);

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
      facet: 'grant_purpose',
      label: 'Purpose',
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
            'grant_purpose':
              refinementList &&
              refinementList.grant_purpose &&
              refinementList.grant_purpose.join('~'),
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
              'grant_purpose': routeState.grant_purpose && routeState.grant_purpose.split('~'),
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
        searchInstance(query);
        gaEventsSearchFocus();
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
        <div id="no-results-ctas" class="hits-empty">\
          <div class="card">
            <div class="card-content">
              <p>No results found for your query <strong>"${ results.query }"</strong></p>
            </div>
          </div>

          <div class="card">
            <div class="card-content">
              <p>
                <span class="text-muted-max small">Searching grants from</span><br>
                ${ targetOrgName }
              </p>
            </div>
          </div>

          <div class="card z-depth-0 grey lighten-4">
            <div class="card-content">
              <div class="card-title">Not finding what you're looking for?</div>
              <p>Search for a <a href="{{ site.url }}/search/profiles/" class="grantmakers-text" data-ga="Profiles Search">different foundation</a></p>
              <p>Search for your query across the entire <a href="{{ site.url }}/search/grants/?query=${ results.query }" class="grantmakers-text" data-ga="Grants Search">grants dataset</a></p>
            </div>
          </div>

          <!-- 
          <div class="card z-depth-0 grey lighten-4">
            <div class="card-content">
              <p>Learn more about <a href="{{ site.url }}/faq/" class="grantmakers-text" data-ga="FAQ">searching on Grantmakers.io</a></p>
            </div>
          </div>
          -->
          
        </div>
      `;

      // Google Analytics events
      document.querySelectorAll('#no-results-ctas a')
        .forEach(e => e.addEventListener('click', gaEventsNoResults));
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
                <td class="pointer" data-facet="grantee_name" data-facet-value="${ item.grantee_name }">${ instantsearch.highlight({ attribute: 'grantee_name', hit: item }) }</td>
                <td class="pointer" data-facet="grant_purpose" data-facet-value="${ item.grant_purpose }">${ instantsearch.highlight({ attribute: 'grant_purpose', hit: item }) }</td>
                <td class="pointer no-wrap" 
                  data-facet="${ item.grantee_city ? 'grantee_city' : 'grantee_state' }" 
                  data-facet-value="${ item.grantee_city && item.grantee_city.length ? item.grantee_city : item.grantee_state }"
                >
                  ${ item.grantee_city && item.grantee_city.length ? instantsearch.highlight({ attribute: 'grantee_city', hit: item }) + ',&nbsp;' + item.grantee_state : item.grantee_state || '' }
                </td>
                <td class="pointer" data-facet="tax_year" data-facet-value="${ item.tax_year }">${ item.tax_year }</td>
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
        'limit': 3,
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
  const createDataAttributes = refinement =>
    Object.keys(refinement)
      .map(key => `data-${key}="${refinement[key]}"`)
      .join(' ');

  const renderListItem = item => `
    ${item.refinements.map(refinement => `
      <li>
        <button class="waves-effect btn blue-grey lighten-3 grey-text text-darken-3 truncate" ${createDataAttributes(refinement)}><i class="material-icons right">remove_circle</i><small>${getLabel(item.label)}</small> ${formatIfRangeLabel(refinement)} </button>
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
      scrollTo: false,
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
    const elemsFS = document.querySelectorAll('select');
    M.FormSelect.init(elemsFS);
    reInitPushpin();
    hideSeoPlaceholders();
    showSortByDropdown();
  });

  search.on('render', function() {
    throttle(readyToSearchScrollPosition(), 1000);
  });

  search.on('error', function(e) {
    if (e.statusCode === 429) {
      renderRateLimit();
      console.log('Rate limit reached'); // eslint-disable-line no-console
    }
    if (e.statusCode === 403) {
      renderForbidden();
      console.log('Origin forbidden'); // eslint-disable-line no-console
    }
    // console.log(e);
  });

  // Scroll to top upon input change
  // =======================================================
  function readyToSearchScrollPosition() {
    // Skip if scrollBox already in search position
    const elem = document.getElementById('grants');
    const top = elem.getBoundingClientRect().top;
    const topRounded = Math.round(top);
    if (topRounded === scrollBuffer) {
      renderCount++;
      return false;
    }

    // Skip if first render to prevent auto-scroll on initial page load
    if (renderCount > 0) {
      $('html, body').animate({scrollTop: scrollAnchor}, '500', 'swing');
      /* https://stackoverflow.com/a/48901013/1944104
      document.getElementById('id').scrollIntoView({
        behavior: 'smooth'
      });
      */
    }
    return renderCount++;
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
  function gaEventsSearchFocus() {
    if (typeof gaCheck === 'function' && gaCount === 0) {
      ga('send', 'event', {
        eventCategory: 'Profile Events',
        eventAction: 'Profile Search Focus',
        eventLabel: 'Grants search',
      });
    }
    gaCount++;
  }

  function gaEventsNoResults() {
    if (typeof gaCheck === 'function') {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Profile No Results CTA Click',
        'eventLabel': this.dataset.ga,
      });
    }
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
          'html': '<span class="toast-intro">Nothing to filter</span> Only one tax year available',
          'displayLength': 4000,
        });
      });
    }
  }

  // TODO Replace with smoothscroll polyfill
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

    if (facet !== 'grant_amount' && facet !== 'tax_year') {
      search.helper.toggleFacetRefinement(facet, value).search();
    } else if (facet === 'grant_amount') {
      M.Toast.dismissAll();
      M.toast({
        'html': '<span class="toast-intro">ProTip</span> Try the Amount slider',
        'displayLength': 4000,
      });
    } else if (facet === 'tax_year') {
      // Only allow refining if multiple tax years exist
      if (targetTaxYearOnlyOne) {
        M.Toast.dismissAll();
        M.toast({
          'html': '<span class="toast-intro">Nothing to filter</span> Only one tax year available',
          'displayLength': 4000,
        });
      } else {
        search.helper.toggleFacetRefinement(facet, value).search();
      }
    }
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
    if (isNaN(num)) { return num; } // terminate early if already a string - handles edge case likely caused by caching
    const fixed = !decimals || decimals < 0 ? 0 : decimals; // number of decimal places to show
    const b = num.toPrecision(2).split('e'); // get power
    const k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3); // floor at decimals, ceiling at trillions
    const c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3) ).toFixed(1 + fixed); // divide by power
    const d = c < 0 ? c : Math.abs(c); // enforce -0 is 0
    const e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
    return e;
  }

  function getElementOffset(element) {
    let de = document.documentElement;
    let box = element.getBoundingClientRect();
    let top = box.top + window.pageYOffset - de.clientTop;
    let left = box.left + window.pageXOffset - de.clientLeft;
    return { top: top, left: left };
  }
});
