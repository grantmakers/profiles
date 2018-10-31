import bugsnag from 'bugsnag-js';
import bugsnagVue from 'bugsnag-vue';
import Vue from 'vue';
import App from './App';
import VueClipboard from 'vue-clipboard2';

// Bugsnag error reporting
const bugsnagClient = bugsnag('00805536ffe700bc0b6bf8452b547742');
bugsnagClient.use(bugsnagVue(Vue));

// VueClipboard.config.autoSetContainer = true // add this line if allowing copy from SavedProfile component
Vue.use(VueClipboard);
Vue.config.productionTip = false;

new Vue({ // eslint-disable-line no-new
  el: '#root',
  components: { App },
  template: '<App/>',
});
