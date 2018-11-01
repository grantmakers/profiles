import bugsnagClient from './utils/bugsnag.js';
import Vue from 'vue';
import App from './App';
import VueClipboard from 'vue-clipboard2';

// Bugsnag error reporting
import bugsnagVue from 'bugsnag-vue';
bugsnagClient.use(bugsnagVue(Vue));

// VueClipboard.config.autoSetContainer = true // add this line if allowing copy from SavedProfile component
Vue.use(VueClipboard);
Vue.config.productionTip = false;

new Vue({ // eslint-disable-line no-new
  el: '#root',
  components: { App },
  template: '<App/>',
});
