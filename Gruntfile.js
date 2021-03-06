module.exports = function(grunt) {

  grunt.initConfig({
    sass: {
      dist: {
        options: {
          sourcemap: 'none'
        },
        files: [{
          expand: true,
          cwd: 'scss',
          src: ['*.scss'],
          dest: 'css',
          ext: '.css'
        }]
      }
    },

    clean: {
      dev: {
        src: ['css'],
      },
      dist: {
        src: ['dist'],
      }
    },

    mkdir: {
      dev: {
        options: {
          create: ['css']
        },
      },
      dist: {
        options: {
          create: ['dist']
        },
      }
    },

    copy: {
      dist: {
        files: [
          {
            expand: true,
            src: ['css/*', 'js/*', 'index.html'],
            dest: 'dist/'
          }
        ]
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'js/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('default', ['jshint', 'clean:dev', 'mkdir:dev', 'sass']);
  grunt.registerTask('dist', ['default', 'mkdir:dist', 'copy:dist']);
};
