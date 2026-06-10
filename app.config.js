
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
    : null;

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
      ...appJson.expo.ios,
      bundleIdentifier: 'com.stylove.mobile',
      usesAppleSignIn: true,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    plugins: [
      ...basePlugins,
      'expo-apple-authentication',
      notificationPlugin,
      ...(sentryPlugin ? [sentryPlugin] : []),
    ],
    extra: {
      ...appJson.expo.extra,
      eas: {
        ...appJson.expo.extra?.eas,
        projectId: '40bafb77-1e46-468d-bd9d-eb3ec925da8e',
      },
    },
  },
};