# PykCharts

PykCharts is a Javascript charting library built on d3.js

Official website: www.pykih.com

Licensing: https://github.com/pykih/PykCharts/blob/master/LICENSE.md

## Installation
PykCharts need an HTTP server to render the charts based on the data recieved as JSON files. Any simple HTTP Server can do. Here are the instructions for a Node HTTP server and Python HTTP server

### Python Server
Python Server can be easily set up with a built-in module SimpleHTTPServer. Simply navigate to root of this code source tree and run the following.

	$ python -m SimpleHTTPServer

If the module is not pre-installed, manual installation may be required.

### Node Server
Node Server can be set up by installing http-server module using the Node Package Manager. Root privileges maybe required

	$ sudo npm install -g http-server

Once installed, navigate to the root of the source tree and run the following.

	$ http-server

## Running the code
Navigate to localhost:8080 (or the default port specified by your HTTP Server) from your browser and open the html file.

## Building the source
PykCharts uses Grunt.js to automate the build process. The following would help you to set up Grunt if you've never used grunt before.

1. Make sure the latest version of Node.js and npm are installed in your system. Follow this [link](https://github.com/joyent/node/wiki/Installation) to install node.js
2. Update Node.js (if required).

		$ sudo npm install -g n

		$ sudo n stable
	
3. Install grunt-cli:

		$ sudo npm install -g grunt-cli
	
4. Install all the package dependecies

		$ sudo npm install -d
	
5. Build the source using grunt

		$ grunt build
