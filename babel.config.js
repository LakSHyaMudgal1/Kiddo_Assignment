module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@theme': './src/theme',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@utils': './src/utils',
            '@context': './src/context',
            '@registry': './src/registry',
            '@actions': './src/actions',
            '@assets': './assets',
            '@renderer': './src/renderer',
          },
        },
      ],
    ],
  };
};
