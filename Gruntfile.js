module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist'],
    copy: {
      main: {
        files: [
        {
          expand: true,
          cwd: 'html/',
          src: ['**/*.html'],
          dest: 'dist/'
        }, {
          src: ['vendor/**'],
          dest: 'dist/'
        }, {
          src: ['font/**'],
          dest: 'dist/'
        }, {
          src: ['images/**'],
          dest: 'dist/'
        }, {
          src: ['audio/**'],
          dest: 'dist/'
        }
        ]
      }
    },
    useminPrepare: {
      html: 'dist/**/*.html'
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: 'game',
          paths:{
            underscore: 'lib/underscore/underscore-min',
            stats: 'lib/stats/build/stats.min',
            raf: 'lib/rAF'
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
          name: 'lib/almond/almond',
          include: ['client/init'],
          insertRequire: ['client/init'],
          out: 'dist/js/beercamp.min.js',
          wrap: true
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
          // usemin does not currently replace references to versioned files in js
          // 'dist/**/*.{js,css,jpg,jpeg,gif,png,svg,eot,ttf,woff}'
          'dist/**/*.{js,css}'
        ]
      }
    },
    usemin: {
      html: ['dist/**/*.html']
      // css: ['dist/**/*.css'] // not currently versioning image assets
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
        src: ['css/**/*.css']
      }
    },
    compass: {
      dev: {
        options: {
          sassDir: 'sass',
          cssDir: 'css',
          imagesDir: 'images',
          fontsDir: 'font',
          relativeAssets: false,
          noLineComments: false,
          outputStyle: 'expanded'
        }
      },
      prod: {
        options: {
          sassDir: 'sass',
          cssDir: 'dist/css',
          imagesDir: 'images',
          fontsDir: 'font'
          // noLineComments: true,
          // outputStyle: 'expanded'
          // debugInfo: true
        }
      }
    },
    templatePath: 'html/templates',
    htmlbuild: {
      main: {
          src: 'html/*.html',
          dest: 'dist',
          options: {
              sections: {
                  banner:    '<%= templatePath %>/banner.html',
                  analytics: '<%= templatePath %>/analytics.html',
                  header:    '<%= templatePath %>/header.html'
              }
          }
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
  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-compass');

  grunt.registerTask('default', [
    'clean',
    'copy',
    'compass:prod',
    'htmlbuild',
    'useminPrepare',
    'requirejs',
    'concat',
    // 'uglify',
    'cssmin',
    'rev',
    'usemin'
  ]);

};
