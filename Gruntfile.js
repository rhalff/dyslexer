'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: ['Gruntfile.js', 'lib/**/*.js'],
      options: grunt.file.readJSON('.jshint')
    },

    shell: {
      build: {
        command: [
          'component',
          'build',
          '-o browser',
          '-n dyslexer'
        ].join(' '),
        options: { stdout: true, stderr: true }
      }
    },
    watch: {
      files: ['spec/*.js', 'lib/**/*.js'],
      tasks: ['test']
    },
    mocha_phantomjs: {
      all: ['spec/runner.html']
    }
  });
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-release');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('build', ['jshint', 'shell:build']);
  grunt.registerTask('test', ['build', 'mocha_phantomjs']);
  grunt.registerTask('default', ['build']);
};
