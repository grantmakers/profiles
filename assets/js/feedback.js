---
---
// FAB Button
// ===================
(function() {

  // Styling 
  // temporary until new css released across all profiles
  var isMobile = window.matchMedia('only screen and (max-width: 992px)').matches;
  var stylesModal = '<style>#feedback-js-modal {box-shadow: none;background-color:transparent;}</style>';
  var stylesFab = '';
  if (!isMobile) {
    stylesFab = '<style> .fixed-action-btn {right: 46px;}</style>';
  }

  // Modal
  var subject = encodeURIComponent(document.title);
  var url = window.location.protocol + '//' + window.location.host + window.location.pathname;
  var modal = '<div id="feedback-js-modal" class="modal"> <div class="modal-content"> <div class="row"> <div class="col s12 m6"> <div class="card"> <div class="card-image"> <img src="{{ site.baseurl }}/assets/img/email-profile.png" alt="Email Profile"> <a href="mailto:?to=&subject=' + subject + '&body=%0D%0A%0D%0A' + url + '" target="_blank" class="btn-floating halfway-fab waves-effect waves-light blue"><i class="material-icons">email</i></a> </div> <div class="card-content"> <p>Send to yourself or a colleague</p> </div> </div> </div> <div class="col s12 m6"> <div class="card"> <div class="card-image"> <img src="{{ site.baseurl }}/assets/img/send-feedback.png" alt="Send Feedback"> <a href="mailto:feedback@grantmakers.io?body=%0D%0A%0D%0A' + url + '" target="_blank" class="btn-floating halfway-fab waves-effect waves-light green"><i class="material-icons">email</i></a> </div> <div class="card-content"> <p>Let us know what information is useful</p> </div> </div> </div> </div> <div class="row"> <div class="col s12 center-align"> <a class="white-text" href="mailto:hello@grantmakers.io">hello@grantmakers.io</a> </div> </div> </div> </div>'

  // Feature Discovery
  var discover = '<div class="tap-target blue lighten-1 white-text" data-activates="feedback-fab"> <div class="tap-target-content"> <h5 class="white-text">Did you find the information you\'re looking for?</h5> <p>As a community project, your feedback helps us determine what information to include in profiles.</p> </div> </div>'

  // Button
  var fab = '<div class="fixed-action-btn"><a id="feedback-fab" class="waves-effect btn-floating btn-large btn-grantmakers modal-trigger" href="#feedback-js-modal"><i class="material-icons">mail</i></a></div>';

  // Insert into DOM
  $('body').append(modal);
  $('.feedback-wrapper').html(stylesFab + stylesModal + fab + discover);

  // Initialize
  $('.modal').modal();
  $('.modal-trigger').modal();

  var scrollFireOptions = [
    {selector: 'footer', offset: 0, callback: function(el) {
      $('.tap-target').tapTarget('open')
    } },
  ];
  Materialize.scrollFire(scrollFireOptions);

})();
