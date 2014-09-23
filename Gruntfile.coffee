module.exports = (grunt) ->

  'use strict'

  # Load plugins. 
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-install-dependencies'
  grunt.loadNpmTasks 'grunt-bower-cli'  

  # Project configuration.
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    uglify: 
      dev:
        options: 
          mangle: false
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'      
        files: 
          'dist/<%= pkg.name %>.min.js': [ 'dist/<%= pkg.name %>.js' ]

    coffee:
      compile:
        files:
          'dist/<%= pkg.name %>.js': ['src/*.coffee']

    connect:
      server:
        options:
          port: 8000
          hostname: "localhost"

    watch:
      scripts:
        files: ['src/*.coffee', 'less/*.less']
        tasks: ['coffee']
        options:
          livereload: true
      styles:
        files: ['less/*.less']
        tasks: ['less']
        options:
          nospawn: true

    less:
      dev:
        files:
          'css/main.css': 'less/main.less'

    concat:
      bower_js:
        options:
          separator: "\n"
        src: ['bower_components/jquery/jquery.min.js', 
              'bower_components/underscore/underscore-min.js', 
              'bower_components/backbone/backbone.js',
              'bower_components/bootstrap/dist/js/bootstrap.min.js',
              'bower_components/bootstrap/js/tabs.js',
              'bower_components/bootstrap-multiselect/js/bootstrap-multiselect.js',
              'bower_components/FileSaver/FileSaver.js',
              'bower_components/vkbeautify/index.js',
              'bower_components/prism/prism.js']
        dest: 'dist/bower.js'

    copy:
      ace:
        files: [{expand: true, cwd: 'bower_components/ace-builds/src-min/', src: ['**'], dest: 'dist/ace/'}]
      fonts:
        files: [{expand: true, cwd: 'bower_components/bootstrap/dist/fonts/', src: ['*'], dest: 'fonts/'}]


  # Task(s).
  grunt.registerTask 'default', ['coffee', 'uglify', 'less']
  grunt.registerTask 'run', ['connect', 'watch']
  grunt.registerTask 'build', ['install-dependencies', 'bower', 'concat', 'copy:fonts', 'copy:ace']
