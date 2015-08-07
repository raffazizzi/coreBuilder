/**
 * grunt-bower-cli
 * Copyright (c) 2013 Brian Reavis & contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @author Brian Reavis <brian@thirdroute.com>
 */

var fs    = require('fs');
var path  = require('path');
var spawn = require('child_process').spawn;

module.exports = function(grunt) {

	grunt.registerTask('bower', 'Installs bower packages', function() {
		var done, options, bower, args, i, n;

		done = this.async();
		options = this.options({
			action    : 'install',
			directory : 'bower_components',
			args      : []
		});

		options.directory = path.normalize(options.directory);
		args = [options.action, '--allow-root'];
		for (i = 0, n = options.args.length; i < n; i++) {
			args.push(options.args[i]);
		}

		bower = spawn('bower', args);
		bower.stdout.on('data', function(data) { grunt.log.write(data); });
		bower.stderr.on('data', function(data) { grunt.log.error(data); });
		bower.on('close', function(code) {
			if (code !== 0) {
				grunt.fail.warn('Bower ' + options.action + ' failed.');
				return done();
			}

			// clear existing directory
			var clean = function(callback) {
				if (!fs.existsSync(options.directory)) return callback();

				var mv = spawn('rm', ['-rf', options.directory]);
				mv.stdout.on('data', function(data) { grunt.log.write(data); });
				mv.stderr.on('data', function(data) { grunt.log.error(data); });
				mv.on('close', function(code) {
					callback(code !== 0 ? 'Bower directory clean failed.' : null);
				});
			};

			// move directory
			var move = function(callback) {
				var mv = spawn('mv', ['bower_components', options.directory]);
				mv.stdout.on('data', function(data) { grunt.log.write(data); });
				mv.stderr.on('data', function(data) { grunt.log.error(data); });
				mv.on('close', function(code) {
					callback(code !== 0 ? 'Bower directory move failed.' : null);
				});
			};

			if (options.action === 'install' && options.directory !== 'bower_components') {
				clean(function(err) {
					if (err) {
						grunt.fail.warn(err);
						return done();
					}
					move(function(err) {
						if (err) grunt.fail.warn(err);
						else grunt.verbose.ok();
						done();
					});
				});
			} else {
				grunt.verbose.ok();
				done();
			}

		});

	});

};