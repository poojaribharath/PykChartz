module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		js_src_path: 'pykcharts/res/js',
		js_distro_path: "distro",
		css_src_path: "pykcharts/res/css",
		css_distro_path: "distro",

		concat: {
			js: {
				src: ['<%= js_src_path %>/pykcharts.js', '<%= js_src_path %>/*.js'],
				dest: '<%= js_distro_path %>/pykcharts.<%= pkg.version %>.js'
			},
			css: {
				src: ['<%= css_src_path %>/*.css'],
				dest: '<%= css_distro_path %>/pykcharts.<%= pkg.version %>.css'	
			}
		},

		uglify: {
			my_target: {
		      files: {
		        '<%= js_distro_path %>/pykcharts.<%= pkg.version %>.min.js': // destination
		        ['<%= js_distro_path %>/pykcharts.<%= pkg.version %>.js'] // source
		      }
		   }
		},

		cssmin: {
			minify: {
				expand: true,
				cwd: '<%= css_distro_path %>/',
				src: ['pykcharts.<%= pkg.version %>.css', '!*.min.css'],
				dest: '<%= css_distro_path %>/',
				ext: '.<%= pkg.version %>.min.css'
			}
		},

		watch: {
		    src: {
		      files: ['pykcharts/res/css/*.css', 'pykcharts/res/js/*.js'],
		      tasks: ['build'],
		    },
		}

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	grunt.registerTask('build', ['concat', 'uglify', 'cssmin']);

	grunt.event.on('watch', function(action, filepath) {
	  grunt.log.writeln(filepath + ' has ' + action);
	});

}