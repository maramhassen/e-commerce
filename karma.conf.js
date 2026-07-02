const puppeteer = require('puppeteer');
const path = require('path');

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
      require('karma-junit-reporter'), // ✅ IMPORTANT
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    client: {
      jasmine: {},
      clearContext: false
    },

    reporters: ['progress', 'kjhtml', 'junit'], // ✅ important

    junitReporter: {
      outputDir: path.join(__dirname, 'test-results'), // ✅ dossier correct
      outputFile: 'junit.xml',
      useBrowserName: false
    },

    coverageReporter: {
      dir: path.join(__dirname, 'coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'cobertura' } // ✅ obligatoire pour Azure DevOps
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

    browsers: process.env.CI ? ['ChromeHeadlessCI'] : ['Chrome'],

    singleRun: true,
    restartOnFileChange: false,

    logLevel: config.LOG_INFO
  });
};