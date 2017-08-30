---
---
// FAB Button
// ===================
(function() {

  // Styling 
  // temporary until new css released across all profiles
  var isMobile = window.matchMedia('only screen and (max-width: 992px)').matches;
  var fabTempStyling;
  if (!isMobile) {
    fabTempStyling = '<style> .fixed-action-btn {right: 46px;}</style>';
  }

  // Modal
  var modal = '{% include feedback.html %}'

  // Button
  var fab = '<div class="fixed-action-btn"><a class="waves-effect btn-floating btn-large btn-grantmakers modal-trigger" href="#feedback-js-modal"><i class="material-icons">mail</i></a></div>';

  // Insert into DOM
  //$('body').append(modal);
  $('.feedback-wrapper').html(fabTempStyling + fab);

  // Initialize
  $('.modal').modal();
  $('#feedback-js-modal').modal('open');
  //$('.modal-trigger').modal();

})();
