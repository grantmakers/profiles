import bugsnag from 'bugsnag-js';
const bugsnagClient = bugsnag({
  apiKey: '00805536ffe700bc0b6bf8452b547742', // Notify Key - is public
  appVersion: appVersion,
});
export default bugsnagClient;
