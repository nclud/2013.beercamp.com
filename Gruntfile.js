module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist'],
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'html/', src: ['**/*.html'], dest: 'dist/', filter: 'isFile'},
          {expand: true, cwd: 'public/', src: ['vendor/**/*.js'], dest: 'dist/', filter: 'isFile'}
        ]
      }
    }, 
    useminPrepare: {
      html: 'dist/**/*.html'
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: 'game/client',
          paths:{
            underscore: '../lib/underscore/underscore-min',
            stats: '../lib/stats/build/stats.min'
          },
          shim: {
            underscore: {
              exports: '_'
            },
            stats: {
              exports: 'Stats'
            }
          },
          optimize: 'none',
          name: 'init',
          out: 'build/client/init.js'
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
    cssmin: {
      options: {
        report: 'min'
      },
      compress: {
        files: {
          'dist/css/<%= pkg.name %>.css': ['public/css/**/*.css']
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
    usemin: {
      html: ['dist/**/*.html'],
      css: ['dist/**/*.css']
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
    },
    csslint: {
      strict: {
        src: ['public/css/**/*.css']
      }
    }
  });

  // test
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-csslint');

  grunt.registerTask('test', [
    'jshint',
    'csslint'
  ]);

  // build
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-rev');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-manifest');

  grunt.registerTask('html', [
    'clean',
    'copy'
  ]);

  grunt.registerTask('default', [
    'clean',
    'copy',
    'useminPrepare',
    'requirejs',
    'concat',
    'uglify',
    'cssmin',
    'rev',
    'usemin'
  ]);

};
