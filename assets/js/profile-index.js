---
---
function ready(fn) {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  // Navbar
  // =======================================================
  const header = document.querySelector('.header');
  const navbar = document.querySelector('.navbar-profile');
  const range = 64; // Height of navbar

  window.onscroll = function() {
    let scrollTop = window.pageYOffset;
    let height = header.offsetHeight;
    let offset = height / 2;
    let calc = 1 - (scrollTop - offset + range) / range;

    header.style.opacity = calc;

    if (calc > '1') {
      header.style.opacity = 1;
      navbar.classList.add('affix-top');
      navbar.classList.remove('affix');
    } else if ( calc < '0' ) {
      header.style.opacity = 0;
      navbar.classList.add('affix');
      navbar.classList.remove('affix-top');
    }
  };

  // Materialize components
  // =======================================================
  window.onload = function() {
    const elemsSN = document.querySelectorAll('.sidenav');
    M.Sidenav.init(elemsSN);

    const elemsTT = document.querySelectorAll('.tooltipped:not(.v-tooltipped)');
    M.Tooltip.init(elemsTT);

    const elemDD = document.querySelector('.collapsible');
    const optionsDD = {
      'accordion': false,
    };
    M.Collapsible.init(elemDD, optionsDD);
  };
});
