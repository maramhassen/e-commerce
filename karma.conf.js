// Karma configuration file, see link for more information
// https://karma-runner.github.io/6.4/config/configuration-file.html

process.env.CHROME_BIN = require('puppeteer').executablePath
  ? require('puppeteer').executablePath()
  : process.env.CHROME_BIN;

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
      jasmine: {
        // configuration des options Jasmine, ex: random: false
        // voir https://jasmine.github.io/api/edge/Configuration.html
      },
      clearContext: false // laisse le résultat Jasmine Spec Runner visible
    },
    jasmineHtmlReporter: {
      suppressAll: true // supprime tous les messages dupliqués dans la console
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/site-e-commerce'),
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
      outputFile: 'test-results.xml',
      useBrowserName: false
    },
    reporters: ['progress', 'kjhtml', 'junit'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
    browsers: process.env.CI ? ['ChromeHeadlessCI'] : ['Chrome'],
    singleRun: false,
    restartOnFileChange: true,
    browserDisconnectTimeout: 20000,
    browserDisconnectTolerance: 2,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000
  });
};