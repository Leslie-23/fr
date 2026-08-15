// Extends app.json (still the source of truth for everything else) to conditionally wire
// up Google Sign-In's native config plugin -- it needs `iosUrlScheme`, the reversed iOS
// OAuth client ID from Google Cloud Console, which isn't available until those credentials
// are added. Until GOOGLE_IOS_URL_SCHEME is set, prebuild behaves exactly as it did before.
module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];

  const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
  if (iosUrlScheme) {
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return { ...config, plugins };
};
