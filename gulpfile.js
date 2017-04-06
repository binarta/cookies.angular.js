var gulp = require('gulp'),
    minifyHtml = require('gulp-minify-html'),
    templateCache = require('gulp-angular-templatecache');

var minifyHtmlOpts = {
    empty: true,
    cdata: true,
    conditionals: true,
    spare: true,
    quotes: true
};

gulp.task('templates', function () {
    gulp.src('template/**/*.html')
        .pipe(minifyHtml(minifyHtmlOpts))
        .pipe(templateCache('cookies-tpls.js', {standalone: false, module: 'cookies'}))
        .pipe(gulp.dest('src/main/js/'));
});

gulp.task('default', ['templates']);