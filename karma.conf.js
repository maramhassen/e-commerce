module.exports = function(config) {
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
    
    reporters: ['progress', 'kjhtml', 'junit', 'coverage'],
    
    junitReporter: {
      outputDir: 'test-results',
      outputFile: 'junit.xml',
      useBrowserName: false
    },
    
    coverageReporter: {
      dir: 'coverage',
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' },
        { type: 'cobertura' }
      ]
    },
    
    // ✅ Utiliser ChromeHeadless directement
    browsers: ['ChromeHeadless'],
    
    singleRun: true,
    restartOnFileChange: false,
    logLevel: config.LOG_INFO
  });
};