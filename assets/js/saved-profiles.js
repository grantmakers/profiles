let arr = JSON.parse(localStorage.getItem('profiles'));

let savedList = new ReactiveHbs({
  'container': '#saved-list-mount',
  'template': '#saved-list',
  'data': {
    'savedItems': arr,
  },
});

savedList.helpers({
  noItems() {
    let check = JSON.parse(localStorage.getItem('profiles'));
    if (Array.isArray(check) && check.length) {
      return false;
    } else {
      return true;
    }
  },
});

savedList.events({
  'click [data-js="unsave-hbs"]'(e, elm, tpl) {
    console.log(e);
    console.log(elm);
    console.log(tpl);
    let data = tpl.get('savedItems');
    let ein = $(elm).attr('data-ein');
    const after = data.filter(function(a) { return a.ein !== ein;});
    console.log(after);
    tpl.set('savedItems', after);
    localStorage.setItem('profiles', JSON.stringify(after));
    savedList.render();
  },
});

savedList.reactOnChange('savedItems', { 'debounce': 100 }, (tpl) => {
  console.log('items list has changed ', tpl.get('savedItems'));
  savedList.render();
});

savedList.render();

$('a.modal-trigger').on('click', function() {
  console.log('clicked');
  savedList.render();
});

/* Old Methods from profile.js

function loadPreviouslySaved(ein) {
    const arr = JSON.parse(localStorage.getItem('profiles'));
    let exists = false;
    if (arr) {
      for (let i = 0; i < arr.length; i++) {
        // Bind proper click event for left action bar save
        if (arr[i].ein === ein) {
          afterSaveChangeDataAtrributes($('[data-js="save"]'));
          exists = true;
        }
      }
    }
    // populateSavedProfilesModal();
    return exists;
  }

  function populateSavedProfilesModal() {
    const arr = JSON.parse(localStorage.getItem('profiles'));
    const destination = $('#saved');
    let data = {};
    data.profiles = arr;
    // TODO XSS
  }

  function showSavedProfilesModal() {
    // const source   = document.getElementById("entry-template").innerHTML;
    const arr = JSON.parse(localStorage.getItem('profiles'));
    let data = {};
    data.profiles = arr;
  }

  function captureOrgData(target) {
    let org = {};
    org.ein = target.attr('data-ein');
    org.name = target.attr('data-name');
    org.tax_year = target.attr('data-tax-year');
    org.url = target.attr('data-url');
    org.saved_on = new Date().toISOString();
    return org;
  }

  function saveOrgLocally(data) {
    let arr = JSON.parse(localStorage.getItem('profiles'));
    if (!Array.isArray(arr) || !arr.length) {
      arr = [];
    }
    arr.unshift(data);
    console.log(arr);
    localStorage.setItem('profiles', JSON.stringify(arr));
    // populateSavedProfilesModal();
  }

  function unsaveOrgLocally(ein) {
    const before = JSON.parse(localStorage.getItem('profiles'));
    const after = before.filter(function(a) { return a.ein !== ein;});
    localStorage.setItem('profiles', JSON.stringify(after));
    // populateSavedProfilesModal();
  }

  function afterSaveChangeDataAtrributes(target) {
    target.attr('data-js', 'unsave');
    target.attr('data-tooltip', 'Unsave this profile');
    target.attr('data-ga', 'Unsaved profile via Left Action Bar');
    target.find('i').html('star');
    target.find('span').html('SAVED');
  }

  function afterUnsaveChangeDataAtrributes(target) {
    target.attr('data-js', 'save');
    target.attr('data-tooltip', 'Save this profile');
    target.attr('data-ga', 'Saved profile via Left Action Bar');
    target.find('i').html('star_outline');
    target.find('span').html('SAVE');
  }

  // Define save functions
  function save() {
    const target = $(this);
    let org = captureOrgData(target);
    saveOrgLocally(org);
    afterSaveChangeDataAtrributes(target);
    target.off( 'click', save ).on( 'click', unsave );
    let toastHTML;
    if (localStorage.DoNotShowSavedProfileLearnMore && localStorage.DoNotShowSavedProfileLearnMore === 'true') {
      toastHTML = '<span>Saved</span>';
    } else {
      toastHTML = '<span>Saved</span> <button class="btn-flat toast-action toast-action-save-learn-more">Learn More</button>';
      $('.tap-target').tapTarget();
    }
    M.Toast.dismissAll();
    M.toast({ 'html': toastHTML });
    $('.toast-action-save-learn-more').on( 'click', saveLearnMore );
  }
  
  function unsave() {
    const target = $(this);
    const org = captureOrgData(target);
    unsaveOrgLocally(org.ein);
    afterUnsaveChangeDataAtrributes(target);
    target.off( 'click', unsave ).on( 'click', save );
    // TODO Wire in Undo button on modal listings
    // Note - the undo button isn't needed on profile page - only in modal when item dissappears
    // const toastHTML = '<span>Unsaved Profile</span> <button class="btn-flat toast-action toast-action-unsave-undo">Undo</button>';
    M.Toast.dismissAll();
    const toastHTML = '<span>Unsaved Profile</span>';
    M.toast({ 'html': toastHTML });
    $('.toast-action-unsave-undo').on( 'click', unsaveUndo );
  }

  // Define toast actions
  function saveLearnMore() {
    M.Toast.dismissAll();
    $('.tap-target').tapTarget('open');
    localStorage.setItem('DoNotShowSavedProfileLearnMore', 'true');
  }

  function unsaveUndo() {
    M.Toast.dismissAll();
    save('[data-js="save"]');
  }

  // TODO Create delete all function
  // localstorage.removeItem('profiles');
  // window.localStorage.clear();
  // https://stackoverflow.com/questions/7667958/clearing-localstorage-in-javascript

  */
