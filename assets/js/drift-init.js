// Start of Async Drift Code
/* eslint-disable */
function ready(fn) {
  if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  (!function() {
    var t;
    if (t = window.driftt = window.drift = window.driftt || [], !t.init) return t.invoked ? void (window.console && console.error && console.error("Drift snippet included twice.")) : (t.invoked = !0, 
    t.methods = [ "identify", "config", "track", "reset", "debug", "show", "ping", "page", "hide", "off", "on" ], 
    t.factory = function(e) {
      return function() {
        var n;
        return n = Array.prototype.slice.call(arguments), n.unshift(e), t.push(n), t;
      };
    }, t.methods.forEach(function(e) {
      t[e] = t.factory(e);
    }), t.load = function(t) {
      var e, n, o, i;
      e = 3e5, i = Math.ceil(new Date() / e) * e, o = document.createElement("script"), 
      o.type = "text/javascript", o.async = !0, o.crossorigin = "anonymous", o.src = "https://js.driftt.com/include/" + i + "/" + t + ".js", 
      n = document.getElementsByTagName("script")[0], n.parentNode.insertBefore(o, n);
    });
  })();

  drift.SNIPPET_VERSION = '0.3.1';
  drift.load('wmmk7c67hfg2');

  drift.on('ready', function() {
    drift.on('welcomeMessage:open', function() {
      ga('send', 'event', {
        'eventCategory': 'Drift Widget',
        'eventAction': 'Drift Clicked Button',
        'eventLabel': event.conversationId,
      });
    });
    drift.on('startConversation', function(event) {
      ga('send', 'event', {
        'eventCategory': 'Drift Widget',
        'eventAction': 'Drift Started Conversation',
        'eventLabel': event.conversationId,
      });
    });
    drift.on('sidebarOpen', function(event) {
      ga('send', 'event', {
        'eventCategory': 'Drift Widget',
        'eventAction': 'Drift Continued Conversation',
        'eventLabel': event.conversationId,
      });
    });
  });
});
// End of Async Drift Code -->
