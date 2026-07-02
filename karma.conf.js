const puppeteer = require('puppeteer');
const path = require('path');

// Définit CHROME_BIN pour CI
process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function (config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-junit-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    client: {
      jasmine: {},
      clearContext: false
    },

    // ✅ Les reporters sont configurés ici (pas besoin de --reporters)
    reporters: ['progress', 'kjhtml', 'junit', 'coverage'],

    junitReporter: {
      outputDir: path.join(__dirname, 'test-results'),
      outputFile: 'junit.xml',
      useBrowserName: false
    },

    coverageReporter: {
      dir: path.join(__dirname, 'coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' },
        { type: 'cobertura' }
      ]
    },

    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ]
      }
    },

    browsers: ['ChromeHeadlessCI'],

    singleRun: true,
    restartOnFileChange: false,

    logLevel: config.LOG_INFO
  });
};