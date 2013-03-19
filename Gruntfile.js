module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist'],
    requirejs: {
      compile: {
        options: {
          appDir: 'game',
          baseUrl: 'client',
          paths:{
            underscore: '../lib/underscore/underscore-min',
            stats: '../lib/stats/build/stats.min'
          },
          dir: 'build',
          shim: {
            underscore: {
              exports: '_'
            },
            stats: {
              exports: 'Stats'
            }
          },
          optimize: 'none',
          removeCombined: true,
          fileExclusionRegExp: /(^\.)|(server)/,
          modules: [
            {
              name: 'init'
            }
          ]
        }
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['build/**/*.js'],
        dest: 'dist/js/<%= pkg.name %>.js'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    rev: {
      options: {
        algorithm: 'sha1',
        length: 8
      },
      files: {
        src: [
          'dist/**/*.{js,css,jpg,jpeg,gif,png,svg,eot,ttf,woff}'
        ]
      }
    },
    csslint: {
      strict: {
        src: ['public/css/*.css']
      }
    },
    jshint: {
      files: ['gruntfile.js', 'game/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    }
  });

  // test
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-csslint');

  grunt.registerTask('test', ['csslint', 'jshint']);

  // build
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-manifest');

  grunt.registerTask('default', ['clean', 'requirejs', 'concat', 'uglify', 'rev']);

};
