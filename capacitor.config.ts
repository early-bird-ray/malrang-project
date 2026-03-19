import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mallang.app',
  appName: '말랑',
  webDir: 'build',
  server: {
    // 프로덕션에서는 로컬 빌드 사용, 개발 시 아래 주석 해제
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#E8DEFF',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#7C5CFC',
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#FAFAF8',
  },
  ios: {
    backgroundColor: '#FAFAF8',
    contentInset: 'automatic',
  },
};

export default config;
