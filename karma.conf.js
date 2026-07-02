const puppeteer = require('puppeteer');

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

    jasmineHtmlReporter: {
      suppressAll: true
    },

    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' },
        { type: 'cobertura' }
      ]
    },

    junitReporter: {
      outputDir: require('path').join(__dirname, './test-results'),
      outputFile: 'junit.xml',
      useBrowserName: false
    },

    reporters: ['progress', 'kjhtml', 'junit'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,

    autoWatch: false,
    singleRun: true,
    restartOnFileChange: false,

    // ✅ SOLUTION: Utiliser ChromeHeadless directement (supporté nativement)
    browsers: ['ChromeHeadless'],

    // ⚠️ OPTIONNEL: Si tu veux garder un custom launcher
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

    browserDisconnectTimeout: 20000,
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000
  });
};