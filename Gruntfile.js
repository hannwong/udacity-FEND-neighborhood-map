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
    },

    mkdir: {
      dev: {
        options: {
          create: ['css']
        },
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.registerTask('default',
    ['clean', 'mkdir', 'sass']);
};
