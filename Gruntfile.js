module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist'],
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    rev: {
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
      files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
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

  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-rev');

  grunt.registerTask('test', ['csslint', 'jshint']);

  grunt.registerTask('default', ['clean', 'concat', 'uglify', 'rev']);

};
