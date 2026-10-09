import type { ExpoConfig } from 'expo/config';

// Mirrors colors.bg in src/theme/tokens.ts; the config loader can't import app sources.
const BACKGROUND = '#F7F4EE';

const config: ExpoConfig = {
  name: 'Tula',
  slug: 'tula',
  scheme: 'tula',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  backgroundColor: BACKGROUND,
  icon: './assets/icon.png',
  ios: {
    bundleIdentifier: 'app.tula.health',
    supportsTablet: true,
  },
  android: {
    package: 'app.tula.health',
    adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: BACKGROUND },
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    [
      'expo-splash-screen',
      { backgroundColor: BACKGROUND, image: './assets/splash-icon.png', imageWidth: 160 },
    ],
    [
      'expo-build-properties',
      {
        // Release APK target is under 30 MB: arm64 only, R8 and resource shrinking.
        android: {
          buildArchs: ['arm64-v8a'],
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
    ['expo-camera', { cameraPermission: 'Tula uses the camera to photograph your meals.' }],
    [
      'expo-image-picker',
      { photosPermission: 'Tula reads meal photos and lab reports you choose.' },
    ],
    ['expo-audio', { microphonePermission: 'Tula listens when you describe a meal by voice.' }],
    'expo-notifications',
  ],
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
  experiments: {
    typedRoutes: true,
  },
};

export default config;
