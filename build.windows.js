/**
 * Created by zc1415926 on 2017/5/17.
 *
 */
let Q = require('q');
let asar = require('asar');
let gulpUtil = require('gulp-util');
let jetpack = require('fs-jetpack');
let shelljs = require('shelljs');
let packageJson = require('./package.json');
let lodash = require('lodash');

let releaseDir;
let projectDir;
let manifest;
let appDir;

function init() {
    gulpUtil.log('Don\'t forget to run ' + gulpUtil.colors.red('gulp build-production') + ' to refresh the files.');
    projectDir = jetpack;
    appDir = projectDir.dir('./build');
    manifest = appDir.read('./package.json', 'json');
    releaseDir = projectDir.dir('./'+manifest.releaseName+' --release', {empty: true});
    return Q();
}

function copyElectron() {
    gulpUtil.log(releaseDir.path());
    return projectDir.copyAsync('./node_modules/electron/dist', releaseDir.path(), {overwrite: true});
}

function cleanupRuntime() {
    return releaseDir.removeAsync('resources/default_app.asar');
}

function installMainProcessDependencies() {

    let deferred = Q.defer();
    let installText = 'npm install';

    if(lodash.has(packageJson, 'mainProcessDependenies')){
        lodash.mapKeys(packageJson.mainProcessDependenies, function (value, key) {
            installText += ' ' + key + '@' + value;

        });

        shelljs.cd('build');

        shelljs.exec(installText, function (code, stdout, stderr) {

            if (code == 0) {
                console.log('code');
                console.log(code);
                deferred.resolve();
            }
        });

        shelljs.cd('..');

        return deferred.promise;
    }else{
        gulpUtil.log(gulpUtil.colors.red('mainProcessDependenies') + ' field not find in pakcage.json. ' +
            'Please add ' + gulpUtil.colors.red('mainProcessDependenies') +
            ' field just like ' +gulpUtil.colors.red('dependencies') +
            ', if your main process has some 3rd party dependencies.');
    }

}

function createAsar() {
    var deferred = Q.defer();
    asar.createPackage(appDir.path(), releaseDir.path('resources/app.asar'), function () {
        deferred.resolve();
    });
    return deferred.promise;
}
function updateResources() {
    var deferred = Q.defer();

    // Copy your icon from resource folder into build folder.
    projectDir.copy('resources/icon/Rr.ico', releaseDir.path('Rr.ico'));

    // Replace Electron icon for your own.
    let rcedit = require('rcedit');
    rcedit(releaseDir.path('electron.exe'), {
        'icon': releaseDir.path('Rr.ico'),
        'version-string': {
            'ProductName': manifest.releaseName,
            'FileDescription': manifest.description,
        }
    }, function (err) {
        if (!err) {
            deferred.resolve();
        }
    });
    return deferred.promise;
}
//Rename the electron exe
function rename() {
    return releaseDir.renameAsync('electron.exe', manifest.releaseName + '.exe');
}

function build() {
    return init()
        .then(copyElectron)
        .then(cleanupRuntime)
        .then(installMainProcessDependencies)
        .then(createAsar)
        .then(updateResources)
        .then(rename);
}

module.exports = {
    build: build
};