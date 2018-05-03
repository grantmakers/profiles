---
---
$(document).ready(function() {
  'use strict';

  var client = algoliasearch('KDWVSZVS1I', 'ce4d584b0de36ca3f8b4727fdb83c658');
  var index = client.initIndex('grantmakers_io');
  
  autocomplete('#autocomplete-input', { hint: false, openOnFocus: false, minLength: 1 }, [
    {
      source: function(q, cb) {
        if (q === '') {
          cb([
            // { organization_name: 'NOVO FOUNDATION' },
            // { organization_name: 'ABBOTT FAMILY FOUNDATION' },
            // { organization_name: 'BILL AND MELINDA GATES FOUNDATION' }
          ]);
        } else {
          var defaultHits = autocomplete.sources.hits(index, { hitsPerPage: 5 });
          defaultHits(q, cb);
        }
      },
      displayKey: 'organization_name',
      templates: {
        suggestion: function(suggestion) {
          return autocomplete.escapeHighlightedString(suggestion._highlightResult) && autocomplete.escapeHighlightedString(suggestion._highlightResult.organization_name.value) || autocomplete.escapeHighlightedString(suggestion.organization_name);
        },
        footer: function(){
          return '<div class="algolia-logo-autocomplete center-align small">Search powered by <a href="{{ site.algolia_referral_link }}" class="algolia-powered-by-link" title="Algolia"><img class="algolia-logo" src="{{site.url}}{{site.baseurl}}/assets/img/algolia-light-bg.svg" alt="Algolia" style="width: 60px;height: 16px;" /></a></div>'
        },
        empty: function(){
          return '<div class="empty">Not finding what you need? Try our <a href="{{ site.url }}">full search</a>.</div>';
        }
      }
    }
  ]).on('autocomplete:selected', function(event, suggestion, dataset) {
    var ein = suggestion.ein;
    var target = 'https://www.grantmakers.io/profiles/' + ein;
    if(ein) {
      location.href = target;
    } else {
      var $toastContent = $('<span>Something went wrong</span>').add($('<button class="btn-flat toast-action toast-action-redirect">Try main search page</button>'));
      M.toast({
        html: $toastContent, 
        displayLength: 10000
      });
      $('.toast-action-redirect').on('click', function(){
        location.href = 'https://www.grantmakers.io';
      });
    }
  });
});
