import { app } from './firebase';

let analytics = null;

const isDev = process.env.NODE_ENV === 'development';

const initAnalytics = async () => {
  if (analytics || !app || isDev) return null;
  try {
    const { getAnalytics } = await import('firebase/analytics');
    analytics = getAnalytics(app);
    return analytics;
  } catch (error) {
    console.error('Analytics init error:', error);
    return null;
  }
};

export const trackEvent = async (name, params = {}) => {
  if (isDev) {
    console.log(`[Analytics] ${name}`, params);
    return;
  }
  try {
    if (!analytics) await initAnalytics();
    if (analytics) {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, name, params);
    }
  } catch (error) {
    console.error('Track event error:', error);
  }
};

export const trackScreenView = async (screenName) => {
  await trackEvent('screen_view', { screen_name: screenName });
};

export const trackFeatureUse = async (feature) => {
  await trackEvent('feature_use', { feature_name: feature });
};

export const setUserProperties = async (props) => {
  if (isDev) {
    console.log('[Analytics] setUserProperties', props);
    return;
  }
  try {
    if (!analytics) await initAnalytics();
    if (analytics) {
      const { setUserProperties: fbSetUserProps } = await import('firebase/analytics');
      fbSetUserProps(analytics, props);
    }
  } catch (error) {
    console.error('Set user properties error:', error);
  }
};
