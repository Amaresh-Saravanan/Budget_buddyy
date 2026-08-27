// True when running inside the Capacitor native shell (the Android app)
// rather than a normal desktop/mobile browser.
export const isNativeApp = () =>
  typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.())

// Google (and Meta) refuse OAuth sign-in from embedded webviews with a
// "disallowed_useragent" error, so the social buttons cannot work inside the
// Capacitor shell without a Custom Tabs + deep-link flow. Email/password goes
// straight to Clerk's API and works fine, so that's what the app offers.
export const supportsOAuthSignIn = () => !isNativeApp()

export default { isNativeApp, supportsOAuthSignIn }
