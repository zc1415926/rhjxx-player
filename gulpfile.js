/**
 * Created by zc1415926 on 2017/5/15.
 */
let gulp = require('gulp');
let gulpUtil = require('gulp-util');
let useref = require('gulp-useref');
let webpack = require('webpack');

var webpackStream = require('webpack-stream');
let babel = require("gulp-babel");

let es2015 = require("babel-preset-es2015");
let react = require("babel-preset-react");
let electronConnect = require('electron-connect').server.create({path: './build', logLevel: 0});

let config = {
    path: {
        htmlSrcPath: 'src/app/index.html',
        htmlDestDir: 'build/app/',
        cssSrcPath: 'src/app/css/main.css',
        cssDestDir: 'build/app/css/',
        fontSrcPath: 'resources/font/*',
        fontDestDir: 'build/app/font/',
        jsxSrcDir: 'src/app/',
        jsxDestDir: 'build/app/'
    }
};

gulp.task('build-react', function () {
    gulp.src('src/app/**/*.jsx')
        .pipe(babel({presets: [es2015, react]}))
        .pipe(gulp.dest('temp/app'))
        .pipe(webpackStream({
            output:{filename: 'bundle.js'},
            stats:{colors:true},
        }, webpack))

        .pipe(gulp.dest('build/app'));
});

gulp.task('build-react-production', function () {
    gulp.src('src/app/**/*.jsx')
        .pipe(babel({presets: [es2015, react]}))
        .pipe(gulp.dest('temp/app'))
        .pipe(webpackStream({
            output:{filename: 'bundle.js'},
            stats:{colors:true},
            plugins: [
                new webpack.optimize.UglifyJsPlugin({
                    output: {
                        comments: false,  // remove all comments
                    },
                    compress: {
                        warnings: false
                    },
            })]
        }, webpack))

        .pipe(gulp.dest('build/app'));
});

gulp.task('copy-main-js', function () {
    gulp.src('src/main.js')
        .pipe(gulp.dest('build'));
});
gulp.task('copy-index-html', function () {
    gulp.src(config.path.htmlSrcPath)
        .pipe(gulp.dest(config.path.htmlDestDir));
});

gulp.task('copy-app-files-useref', function () {
    //main.js
    gulp.src('src/main.js')
        .pipe(useref())
        .pipe(gulp.dest('build'));
    //index.html
    gulp.src('src/app/index.html')
        .pipe(useref())
        .pipe(gulp.dest('build/app'));
});

gulp.task('copy-static-files', function () {
    //package.json
    gulp.src('package.json')
        .pipe(gulp.dest('build'));
    //fonts
    gulp.src(config.path.fontSrcPath)
        .pipe(gulp.dest(config.path.fontDestDir))
    //css
    gulp.src(config.path.cssSrcPath)
        .pipe(gulp.dest(config.path.cssDestDir));
});

gulp.task('copy-files', ['copy-static-files', 'copy-main-js', 'copy-index-html']);

gulp.task('copy-files-useref', ['copy-static-files', 'copy-app-files-useref']);

gulp.task('watchWithConnect', function () {
    electronConnect.start();

    gulp.watch('src/app' + '**/*.jsx', ['build-react']);
    gulp.watch('src/app/index.html', ['copy-index-html']);
    gulp.watch('src/main.js', ['copy-main-js']);
    gulp.watch('src/app/css/main.css', function () {
        gulp.src(config.path.cssSrcPath)
            .pipe(gulp.dest(config.path.cssDestDir));
    });

    gulp.watch('build/app' + '/**/*', function () {
        electronConnect.reload();
        gulpUtil.log('Electron reloaded');
    });
    gulp.watch('build/main.js', function () {
        electronConnect.restart();
        gulpUtil.log('Electron restarted');
    });

    //Cann't stop watch. Gulp is just running as a never ending process
});

// gulp.watch cann't watch new files,
// using Ctrl + R for reload manually.
var release = require('./build.windows');
gulp.task('release', function () {
    return release.build();
});

gulp.task('build', ['copy-files', 'build-react']);
gulp.task('build-production', ['copy-files-useref', 'build-react-production']);
gulp.task('run', ['watchWithConnect']);
gulp.task('default', ['copy-files', 'build-react', 'watchWithConnect']);