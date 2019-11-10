import bugsnag from 'bugsnag-js';
const bugsnagClient = bugsnag({
  apiKey: '00805536ffe700bc0b6bf8452b547742', // Notify Key - is public
  appVersion: appVersion,
  beforeSend: function(report) {
    // Suppress unhandled errors caused by Facebook's fbclid parameter
    const params = new URLSearchParams(location.search);
    const fbclidCheck = params.get('fbclid');
    if (fbclidCheck && report.errorClass === 'TypeError' && report.errorMessage === 'Illegal invocation') {
      report.ignore();
    }
  },
});
export default bugsnagClient;
