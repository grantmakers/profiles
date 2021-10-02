function ready(fn) {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  const client = algoliasearch('KDWVSZVS1I', 'ce4d584b0de36ca3f8b4727fdb83c658');
  const index = client.initIndex('grantmakers_io');
  
  autocomplete('#autocomplete-input', { hint: false, openOnFocus: false, minLength: 1 }, [
    {
      source: function(q, cb) {
        if (q === '') {
          cb([
            // Defaults
            // { organization_name: 'NOVO FOUNDATION' },
            // { organization_name: 'ABBOTT FAMILY FOUNDATION' },
            // { organization_name: 'BILL AND MELINDA GATES FOUNDATION' }
          ]);
        } else {
          let defaultHits = autocomplete.sources.hits(index, { hitsPerPage: 5 });
          defaultHits(q, cb);
        }
      },
      displayKey: 'organization_name',
      templates: {
        suggestion: function(suggestion) {
          return autocomplete.escapeHighlightedString(suggestion._highlightResult) && autocomplete.escapeHighlightedString(suggestion._highlightResult.organization_name.value) || autocomplete.escapeHighlightedString(suggestion.organization_name);
        },
        footer: function() {
          return '<div class="algolia-logo-autocomplete center-align small">Search powered by <a href="http://goto.algolia.com/l/139121/2017-10-24/26gc84" class="algolia-powered-by-link" title="Algolia"><img class="algolia-logo" src="https://www.grantmakers.io/profiles/assets/img/algolia-light-bg.svg" alt="Algolia" style="width: 60px;height: 16px;" /></a></div>';
        },
        empty: function() {
          return '<div class="empty">Not finding what you need? Try our <a href="https://www.grantmakers.io/search/profiles">full search</a>.</div>';
        },
      },
    },
  ]).on('autocomplete:selected', function(event, suggestion, dataset) { // eslint-disable-line no-unused-vars
    if (suggestion) {
      location.href = 'https://www.grantmakers.io/profiles/' + suggestion.ein;
    } else {
      const toastContent = '<span>Something went wrong</span> <a href="https://www.grantmakers.io/search/profiles/" class="btn-flat toast-action toast-action-redirect">Try main search page</a>';
      M.toast({
        html: toastContent,
        displayLength: 10000,
      });
    }
  });
});
