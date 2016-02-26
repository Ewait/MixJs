module.exports = function (grunt) {
  // 项目配置
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: 'src/*.js',
        dest: 'dest/<%= pkg.file %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.file %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'dest/<%= pkg.file %>.js',
        dest: 'dest/<%= pkg.file %>.min.js'
      }
    }
  });
  // 加载提供"uglify"任务的插件
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  // 默认任务
  grunt.registerTask('default', ['concat','uglify']);
}