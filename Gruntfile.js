module.exports = function(grunt) {

	grunt.initConfig({

		uglify: {
			my_target: {
		      files: {
		        'distro/pykcharts.min.js': // destination
		        [
		        	'pykcharts/res/js/pykcharts.js', 
		        	'pykcharts/res/js/bubble.js', 
		        	'pykcharts/res/js/chord.js', 
		        	'pykcharts/res/js/choropleth.js', 
		        	'pykcharts/res/js/googlemap.js',
		        	'pykcharts/res/js/river.js',
		        	'pykcharts/res/js/treerect.js',
		        	'pykcharts/res/js/ultimate.js'
		        ] // source
		      }
		    }
		},

		cssmin: {

			combine: {
				files: {
				'distro/pykcharts.css': [
					'pykcharts/res/css/chord.css',
					'pykcharts/res/css/choropleth.css',
					'pykcharts/res/css/dc.css',
					'pykcharts/res/css/googlemap.css',
					'pykcharts/res/css/river.css',
					'pykcharts/res/css/ultimate.css'
					]
				}
			},
			minify: {
				expand: true,
				cwd: 'distro/',
				src: ['pykcharts.css', '!*.min.css'],
				dest: 'distro/',
				ext: '.min.css'
			}
		},

		watch: {
		    src: {
		      files: ['pykcharts/res/css/*.css', 'pykcharts/res/js/*.js'],
		      tasks: ['build'],
		    },
		},
		clean: ["distro/pykcharts.css"]

	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('build', ['uglify', 'cssmin', 'clean']);

	grunt.event.on('watch', function(action, filepath) {
	  grunt.log.writeln(filepath + ' has ' + action);
	});

}