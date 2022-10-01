---
---
function ready(fn) {
  'use strict';
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  'use strict';
  // BROWSER CHECKS
  // =======================================================
  // TODO Need to refactor initial browser checks - this is a mess!
  const isIE11 = !!window.MSInputMethodContext && !!document.documentMode; // Note: does not detect <IE11
  const isMobile = window.matchMedia('only screen and (max-width: 992px)');

  let isSupported = browserTest();
  let allowsCookies = cookieTest();
  let allowsLocalStorage = storageTest();

  // Load Vue if supported
  const vue = document.createElement('script');
  vue.src = '{{ site.baseurl }}/assets/js/bundle.js?v={{ site.time | date: "%Y%m%d"}}';
  if (!isIE11 && !isMobile.matches && allowsCookies && allowsLocalStorage && isSupported) {
    // document.body.appendChild(vue);
  } else {
    // Hide UI elements created in DOM, but handled by Vue
    const vueElements = document.querySelectorAll('.js-vue-check');
    vueElements.forEach(function(el) {
      el.classList.add('hidden');
    });
  }

  // Show message if not supported
  if (isIE11 || !isSupported) {
    const toastContent = '<span>Your browser is currently not supported.<br>Many useful features may not work.</span><a href="https://outdatedbrowser.com/en" class="btn-flat yellow-text toast-action-browser-suggestion">Browser Suggestions</a>';
    M.Toast.dismissAll();
    M.toast({
      'html': toastContent,
      'displayLength': 10000,
    });

    // Hide Algolia elements
    const algoliaElements = document.querySelectorAll('.js-ie-check');
    algoliaElements.forEach(function(el) {
      el.classList.add('hidden');
    });
  }
  
  function browserTest() {
    const parent = document.createElement('div');
    const el = document.createElement('span');
    try {
      parent.prepend(el); // Using ParentNode.prepend() as proxy for supported browsers
      return true;
    } catch (e) {
      return false;
    }
  }

  function cookieTest() {
    let cookieEnabled = navigator.cookieEnabled;
    if (!cookieEnabled) {
      document.cookie = 'testcookie';
      cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
      document.cookie = 'testcookie; expires=Thu, 01-Jan-1970 00:00:01 GMT';
    }
    return cookieEnabled || showCookieFail();
  }

  function showCookieFail() {
    if (!isIE11 && isSupported) {
      M.toast({
        'html': 'Enable cookies to view available profile updates',
      });
    }
    return false;
  }

  function storageTest() {
    const test = 'test';
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // NAVBAR
  // =======================================================
  const header = document.querySelector('.header');
  const navbar = document.querySelector('.navbar-profile');
  const navbarHeight = 64;

  // Set header opacity on page load
  setHeaderOpacity();

  // Adjust opacity after scrolling
  window.addEventListener('scroll', function() {
    setHeaderOpacity();
  });

  function setHeaderOpacity() {
    let scrollTop = window.pageYOffset | document.body.scrollTop;
    let height = header.offsetHeight;
    let offset = height / 2;
    let calc = 1 - (scrollTop - offset + navbarHeight) / navbarHeight;
    header.style.opacity = calc;

    if (calc > 1) {
      header.style.opacity = '1';
      navbar.classList.add('affix-top');
      navbar.classList.remove('affix');
    } else if ( calc < 0 ) {
      header.style.opacity = '0';
      navbar.classList.add('affix');
      navbar.classList.remove('affix-top');
    }
  }

  // INIT MATERIALIZE COMPONENTS
  // =======================================================
  window.onload = function() {
    const elemsNavMore = document.getElementById('primary-navbar-dropdown-trigger');
    const optionsNavMore = {
      'container': 'main-nav',
      'constrainWidth': false,
    };
    M.Dropdown.init(elemsNavMore, optionsNavMore);

    const elemsSideNav = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elemsSideNav);

    const elemsNavScrollspy = document.querySelectorAll('.scrollspy');
    const optionsNavScrollspy = { 'scrollOffset': navbarHeight };
    M.ScrollSpy.init(elemsNavScrollspy, optionsNavScrollspy);

    const elemCommunitySidebar = document.getElementById('community-sidebar');
    const optionsCommunitySidebar = {
      'edge': 'right',
    };
    M.Sidenav.init(elemCommunitySidebar, optionsCommunitySidebar);

    // :not ensures Vue handles relevant initiation for Vue-controlled elements
    const elemsTooltips = document.querySelectorAll('.tooltipped:not(.v-tooltipped)');
    M.Tooltip.init(elemsTooltips);
  };

  // CHART.JS
  // =======================================================
  // Lazy load via Intersection Observer if browser allows
  // Jekyll sets a global variable orgFinancialsStats in profile.html
  const orgCurrentTaxYear = document.querySelector('h1.org-name').dataset.taxYear;
  const chartWrapperOverview = document.getElementById('financial-overview').getElementsByClassName('chart-wrapper')[0];
  const chartWrapperTrends = document.getElementById('financial-trends').getElementsByClassName('chart-wrapper')[0];

  if (!isMobile.matches && 'IntersectionObserver' in window) {
    gaChartsEvents('Charts baseline');
    createChartsObserver();
  }

  function createChartsObserver() {
    let observer;
    let anchor = document.getElementById('financial-overview');
    let config = {
      rootMargin: '0px 0px',
      threshold: 0.01,
    };
    // Initiate observer using Financial Overview section as anchor
    observer = new IntersectionObserver(enableCharts, config);
    observer.observe(anchor);
    // Initiate preloaders / spinners
    // Only need to show Trends chart if more than one tax year is available
    showLoader(chartWrapperOverview);
    if (orgFinancialStats.length > 1) {
      showLoader(chartWrapperTrends);
    }
  }

  function enableCharts(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        gaChartsEvents('Visitor reached financial divs');
        // Run the function that fetches Chart.js and loads it into the DOM
        loadCharts();
        observer.unobserve(entry.target);
      }
    });
  }

  function loadCharts() {
    gaChartsEvents('Loading ChartJS');
    const chartJS = document.createElement('script');
    chartJS.type = 'text/javascript';
    chartJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.min.js';
    // Make Chart.js script available on client
    document.body.appendChild(chartJS);
    // Now that Chart.js script is available, create the charts
    createCharts(chartJS);
  }

  function createCharts(init) {
    const chartsColorPrimary = '#607d8b';
    const chartsColorSecondary = '#c54e00';
    const chartsColorTertiary = '#00bfa5';

    const assets = orgFinancialStats.map(value => value.assets).reverse();
    const distributions = orgFinancialStats.map(value => value.distributions).reverse();
    const contributions = orgFinancialStats.map(value => value.contributions).reverse();
    const years = orgFinancialStats.map(value => value.tax_year).reverse();
    const year1 = orgFinancialStats[0];

    const ctx = document.getElementById('chart-overview').getContext('2d');
    const ctxTrends = document.getElementById('chart-trends').getContext('2d');
    

    init.onload = function() {
      gaChartsEvents('ChartsJS successfully loaded');
      let hideLoaderOverviewExecuted = false;
      const chartsFinancialOverview = new Chart(ctx, { /* eslint-disable-line no-unused-vars */
        type: 'horizontalBar',
        responsive: true,
        data: {
          labels: ['Assets EOY', 'Distributions', 'Contributions' ],
          datasets: [{
            data: [
              year1.assets,
              year1.distributions,
              year1.contributions,
            ],
            backgroundColor: [
              chartsColorPrimary,
              chartsColorSecondary,
              chartsColorTertiary,
            ],
          }],
        },
        options: {
          title: {
            display: true,
            text: `Latest Electronic Tax Filing (${orgCurrentTaxYear})`,
          },
          legend: {
            display: false,
          },
          scales: {
            xAxes: [{
              ticks: {
                beginAtZero: true,
                callback: function(value) {
                  return `$${numberHuman(value, 0)}`;
                },
              },
            }],
            yAxes: [ {
              gridLines: {
                display: false,
              },
            }],
          },
          tooltips: {
            callbacks: {
              label: function(tooltipItem) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(tooltipItem.value);
              },
            },
          },
          animation: {
            onProgress: function(animation) {
              if (animation.numSteps > 0 && !hideLoaderOverviewExecuted) {
                hideLoaderOverviewExecuted = true;
                hideLoader(chartWrapperOverview);
              }
            },
            onComplete: function() {
              gaChartsEvents('Charts successfully drawn');
            },
          },
        },
      });
      // Only need to show Trends chart if more than one tax year is available
      if (orgFinancialStats.length > 1) {
        let hideLoaderTrendsExecuted = false;
        const chartsFinancialTrends = new Chart(ctxTrends, { /* eslint-disable-line no-unused-vars */
          type: 'bar',
          responsive: true,
          data: {
            labels: years,
            datasets: [
              {
                label: 'Assets EOY',
                borderColor: chartsColorPrimary,
                data: assets,
                type: 'line',
                fill: false,
              },
              {
                label: 'Distributions',
                backgroundColor: chartsColorSecondary,
                data: distributions,
              },
              {
                label: 'Contributions',
                backgroundColor: chartsColorTertiary,
                data: contributions,
              },
            ],
          },
          options: {
            title: {
              display: true,
              text: 'All Available Electronic Tax Returns',
            },
            legend: {
              display: true,
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                  callback: function(value) {
                    return `$${numberHuman(value, 0)}`;
                  },
                },
              }],
              xAxes: [ {
                gridLines: {
                  display: false,
                },
              }],
            },
            tooltips: {
              callbacks: {
                label: function(tooltipItem) {
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(tooltipItem.value);
                },
              },
            },
            animation: {
              onProgress: function(animation) {
                if (animation.numSteps > 0 && !hideLoaderTrendsExecuted) {
                  hideLoaderTrendsExecuted = true;
                  hideLoader(chartWrapperTrends);
                }
              },
            },
          },
        });
      }
    };
  }

  function showLoader(el) {
    el.classList.remove('default');
    el.classList.add('loading');
  }

  function hideLoader(el) {
    el.classList.remove('loading');
    el.classList.add('loaded');
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

  function gaChartsEvents(label) {
    let gaCheck = window[window['GoogleAnalyticsObject'] || 'ga']; // eslint-disable-line dot-notation
    if (typeof gaCheck === 'function') {
      ga('send', 'event', {
        'eventCategory': 'Profile Events',
        'eventAction': 'Charts Loading Sequence',
        'eventLabel': label,
      });
    }
  }

  // PDF FILINGS
  // =======================================================
  // No need to call ProPublica API unless user makes it down the page
  // Create an IntersectionObserver to trigger main ProPublica function call
  // IntersectionObserver function is initialized alongside iubenda function
  const gcf = 'https://propublica-proxy-jzc7ggbgfq-uc.a.run.app';

  const proPublicaWrapper = async() => {
    const res = await fetchProPublicaData();
    return createPdfButtons(res);
  };

  function createProPublicaObserver() {
    let observer;
    let anchor = document.getElementById('financial-overview');
    let config = {
      rootMargin: '0px 0px',
      threshold: 0.01,
    };
    // Initiate observer using Footer as anchor
    observer = new IntersectionObserver(enableProPublica, config);
    observer.observe(anchor);
  }

  function enableProPublica(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        proPublicaWrapper();
        observer.unobserve(entry.target);
      }
    });
  }

  async function fetchProPublicaData() {
    const ref = document.getElementById('js-pdfs');
    const ein = ref.getAttribute('data-ein');
    const url = `${gcf}?ein=${ein}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        return `Error! status: ${response.status}`;
      }
  
      const result = await response.json();
      return {ein, result};
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  function createPdfButtons({ein, result}) {
    const ref = document.getElementById('js-pdfs');
    if (result) {
      result.reverse().map((each) => {
        let el = document.createElement('li');
        let link = document.createElement('a');
        link.classList.add('js-filings-pdf', 'waves-effect', 'waves-light', 'btn', 'grey', 'lighten-3', 'grey-text', 'text-darken-1');
        link.innerText = each.tax_prd_yr;
        link.href = each.pdf_url_no_expire;
        link.target = '_blank';
        link.rel = 'noopener';
        link.dataset.ga = 'PDF';
        link.dataset.ein = ein;
        link.title = 'View 990-PF';
        el.appendChild(link);
        ref.after(el);
      });
    }
  }

  function xmlNotAvailable(ein) {
    const toastContent = `<span>XML files not currently available</span><a href="https://projects.propublica.org/nonprofits/organizations/${ein}" target="_blank" class="btn-flat blue-grey-text text-lighten-3 toast-action">Try Here</a>`;
    M.Toast.dismissAll();
    M.toast({
      'html': toastContent,
      'displayLength': 10000,
    });
  }

  // XML Filings
  // =======================================================
  document.querySelectorAll('.js-filings-xml').forEach((el) => {
    const ein = el.dataset.ein;
    el.addEventListener('click', () => { xmlNotAvailable(ein); }, false);
  });

  // Lazy Load Iubenda script
  // =======================================================
  function createIubendaObserver() {
    let observer;
    let anchor = document.querySelector('footer');
    let config = {
      rootMargin: '0px 0px',
      threshold: 0.01,
    };
    // Initiate observer using Footer as anchor
    observer = new IntersectionObserver(enableIubenda, config);
    observer.observe(anchor);
  }

  function enableIubenda(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        iubenda();
        observer.unobserve(entry.target);
      }
    });
  }

  function iubenda() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.iubenda.com/iubenda.js';
    document.body.appendChild(script);
  }

  if ('IntersectionObserver' in window) {
    createIubendaObserver();
    createProPublicaObserver();
  }
});
