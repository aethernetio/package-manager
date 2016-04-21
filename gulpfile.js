var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var assign = Object.assign || require('object.assign');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var tar = require('gulp-tar');
var gzip = require('gulp-gzip');
var fs = require('fs');

/*
  Task to clean up dist-server
  directories
 */
gulp.task('clean', function() {
  return gulp.src(['dist-server', 'dist-package', 'stage', 'stage-control',
                   'stage-data', 'stage-compressed'])
    .pipe(vinylPaths(del));
});

/*
  Task to compile server js code with babel
 */

gulp.task('build-server-js', function () {
  var compilerOptions = {
    modules: 'common',
    moduleIds: false,
    comments: false,
    compact: false,
    stage:2,
    optional: ["es7.decorators", "es7.classProperties"]
  };
  return gulp.src('src-server/**/*.js')
    .pipe(plumber())
    .pipe(changed('dist-server/', {extension: '.js'}))
    .pipe(sourcemaps.init())
    .pipe(babel(assign({}, compilerOptions, {modules:'common'})))
    .pipe(sourcemaps.write({includeContent: false, sourceRoot: '/src-server/' }))
    .pipe(gulp.dest('dist-server/'));
});

/*
  Task to clean and build the entire application
 */
gulp.task('build', function(callback) {
  return runSequence('clean', 'build-server-js', callback);
});

/*
  Stage the files for distribution
 */
 gulp.task('stage-server', ['build'], function() {
   var pkg = JSON.parse(fs.readFileSync('./package.json'));
   return gulp.src('dist-server/**/*')
    .pipe(gulp.dest('stage/apps/server/' + pkg.name + '/' + pkg.version));
 })

/*
    Stage into the data archive
 */
gulp.task('stage-data', ['stage-server'], function() {
  var pkg = JSON.parse(fs.readFileSync('./package.json'));
  return gulp.src('stage/**/*')
    .pipe(tar('data.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('stage-compressed'));
})

/*
    Copy config file(s) to stage-control
 */
gulp.task('stage-config', ['stage-data'], function() {
  return gulp.src('package.json')
    .pipe(gulp.dest('stage-control'));
})

/*
    Stage into the control archive
    TODO Also need to create the md5 checksums
 */
gulp.task('stage-control', ['stage-config'], function() {
  var pkg = JSON.parse(fs.readFileSync('./package.json'));
  return gulp.src('stage-control/**/*')
    .pipe(tar('control.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('stage-compressed'));
})

/*
  Package the files for distribution
 */
gulp.task('package', ['stage-control', 'stage-data'], function() {
  var pkg = JSON.parse(fs.readFileSync('./package.json'));
  return gulp.src('stage-compressed/**/*')
    .pipe(tar(pkg.name + '-' + pkg.version + '-aether-es5.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('dist-package'));
});

/*
    Install into Aethernet / AethOS
 */
gulp.task('install', ['package'], function() {
  // For now, just install directly into Aethernet and bypass processing
  // the package.
  var config = JSON.parse(fs.readFileSync('./aetherconfig.json'));

  return gulp.src('stage/**/*')
    .pipe(gulp.dest(config.shared));
});

/*
  Point default task to build
 */
gulp.task('default', ['build']);
