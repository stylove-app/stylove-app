const appJson = require('./app.json');

const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;

const basePlugins = appJson.expo.plugins.filter((plugin) => {
  if (plugin === '@sentry/react-native') return false;
  return !(Array.isArray(plugin) && String(plugin[0]).startsWith('@sentry/react-native'));
});

const sentryPlugin =
  sentryOrg && sentryProject
    ? [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          organization: sentryOrg,
          project: sentryProject,
        },
      ]
    : '@sentry/react-native';

const notificationPlugin = [
  'expo-notifications',
  {
    color: '#4A121C',
  },
];

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      bundleIdentifier: "com.stylove.app",
    },
    plugins: [...basePlugins, notificationPlugin, sentryPlugin],
  extra: {
    eas: {
      projectId: "40bafb77-1e46-468d-bd9d-eb3ec925da8e",
    },
  },
}
};
