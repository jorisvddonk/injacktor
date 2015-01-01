/*global module:false*/
module.exports = function(grunt) {
  grunt.initConfig({
    
    react: {
      jsx: {
        files: [
          {
            expand: true,
            cwd: '',
            src: [ '*.jsx' ],
            dest: '',
            ext: '.js'
          }
        ]
      }
    },

    watch: {
      react: {
        files: '*.jsx',
        tasks: ['react']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-react');
  
  grunt.registerTask('default', ['react']);
};