// Dependencies
const gulp  = require('gulp'),
    gutil = require('gulp-util'),
    connect = require('gulp-connect'),
    uglify = require('gulp-uglify');
    rename = require('gulp-rename'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    babelify = require('babelify'),
    sass = require('gulp-sass') ,
    autoprefixer = require('gulp-autoprefixer'),
    nano = require('gulp-cssnano'),
    sourcemaps = require('gulp-sourcemaps')

gulp.task('build:es6', function() {
    return browserify({
        // entries: ['./node_modules/jquery/dist/jquery.min.js', './src/js/index.js'],
        entries: './src/js/index.js',
        debug: true
    })
    .transform("babelify", {presets: ['es2015']})
    .bundle()
    .on('error', function (err) { 
        gutil.log("Error : " + err.message);
        this.emit('end'); // This is needed for the watch task, or it'll hang on error
    })
    .pipe(source('cb.js'))
    .pipe(buffer())
    // .pipe(uglify())
    .on('error', function (err) { gutil.log("Error : " + err.message); })
    .pipe(rename('cb.min.js'))
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('build:css', function() {
  return gulp.src('src/scss/**/*.scss')
    .pipe(sass().on('error', function(err) {
      gutil.log('Error: ' + err.message);
      this.emit('end');
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(sourcemaps.init())
    .pipe(nano())
    .pipe(sourcemaps.write('.'))
    .on('error', function(err) {
      gutil.log("Error : " + err.message);
      this.emit('end');
    })
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('watch', function() {
    gulp.watch('src/scss/**/*.scss', ['build:css']);
    gulp.watch('src/js/**/*.js', ['build:es6']);
})

gulp.task('webserver', function() {
  connect.server({livereload: true, port: 8888});
});

gulp.task('default', ['build:css', 'build:es6']);
gulp.task('run', ['webserver', 'build:css', 'build:es6', 'watch']);