require('./utils');
const fs = require('fs');

const path = require('path');
Utils.path = path;
Utils.isServer = true;
// path.fileName = function (fullFileName, withExt) {
//     if (withExt) return path.win32.basename(fullFileName);
//     let extension = path.extname(fullFileName);
//     return path.win32.basename(fullFileName, extension);
// };
path.cutLastSegment = function (dir) {
    dir = path.normalize(dir);
    let pos = dir.lastIndexOf(path.sep);
    if (pos === -1) return '';
    return dir.substring(0, pos);
};

const initParser = require('./parser');
const ErrorsFactory = require('./errors/errors');
const dbg = require('./dbg/debugger');
const allowLoggingInDebugModel = false;

'use strict';
const viewStartName = '_viewStart';
const EOL = require('os').EOL;

module.exports = class Razor {
    constructor(options, razorOpts) {
        this.options = options;
        this.ext = options.settings['view engine'] || razorOpts.ext;
        this.env = options.settings.env;
        const debug = dbg.isDebugMode;
        const log = require('./dbg/logger')({ on: debug && allowLoggingInDebugModel });
        this.parser = initParser({ express: true, dbg, log });
        this.viewsDir = path.resolve(this.options.settings.views);
    }

    renderFile(filepath, done) {
        let originFilePath = filepath;
        filepath = path.normalize(filepath);
        //let fileName = path.fileName(filepath);
        //let viewsPath = path.normalize(this.options.settings.views);

        if (!path.extname(filepath))
            filepath += '.' + this.ext;

        fs.readFile(filepath, (err, data) => {
            if (err) {
                let error = new ErrorsFactory({ filename: path.basename(originFilePath) }).errorReadingFile(err);
                return done(error); // Tested by [0# Razor.readFile].
            }

            let currentDir = path.dirname(filepath);
            let jsHtml = this.addFileNameIfDev(data, filepath);

            this.findViewStarts(currentDir, '', (err, viewStartsJsHtml) => {
                if (err)
                    return done(err);

                let parserArgs = {
                    filePath: filepath,
                    template: viewStartsJsHtml + jsHtml,
                    model: this.options,
                    findPartial: (layoutName, filePath, errorsFactory, done) => {
                        var startDir = path.dirname(filePath);
                        this.findPartial(startDir, layoutName, [], errorsFactory, done);
                    },
                    findPartialSync: (layoutName, filePath, errorsFactory, cache) => {
                        var startDir = path.dirname(filePath);
                        return this.findPartialSync(startDir, layoutName, [], errorsFactory, cache);
                    }
                };

                this.parser.compile(parserArgs, done);
            });
        });
    }

    findViewStarts(startDir, buffer, done) {
        const fileName = this.viewStartName();
        const filePath = path.join(startDir, fileName);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code !== 'ENOENT') {
                    let error = new ErrorsFactory({ filename: path.basename(filePath) }).errorReadingFile(err);
                    return done(error); // Tested by [#1 Razor.findViewStarts].
                }
            }
            else {
                let dataStr = this.addFileNameIfDev(data, filePath);
                buffer = (buffer) ? dataStr + buffer : dataStr; // the `concat` order is important here!
            }

            startDir = startDir.equal(this.viewsDir, true) ? null : path.cutLastSegment(startDir);

            if (startDir)
                return this.findViewStarts(startDir, buffer, done);

            return done(null, buffer);
        });
    }

    findPartialSync(startDir, partialViewName, searchedLocations, errorsFactory, cache) {
        searchedLocations = searchedLocations || [];

        if (!partialViewName || !partialViewName.length)
            throw errorsFactory.partialLayoutNameExpected(); // Tested by [2.2].

        let viewFileExt = path.extname(partialViewName);

        if (!viewFileExt.equal('.' + this.ext))
            partialViewName += '.' + this.ext;

        if (partialViewName[0] === '/' || partialViewName[0] === '.') {
            let viewPath = path.normalize(partialViewName);

            if (partialViewName[0] === '/') { // it's relative to the `views` root folder
                if (!viewPath.startsWithIC(this.viewsDir)) // for linux only (in Windows an absolute path cannot start with '/')
                    viewPath = path.join(this.viewsDir, viewPath);
                // [#2.4.1], [#2.4.2], [#2.4.3]
            }
            else if (partialViewName[0] === '.') { // it's relative to the current folder
                viewPath = path.join(startDir, viewPath); // [#2.4.4], [#2.4.5]
            }

            try {
                searchedLocations.push(viewPath);
                let cachedData = cache && cache[viewPath];

                if (cachedData)
                    return cachedData;

                let data = fs.readFileSync(viewPath);
                let dataStr = this.addFileNameIfDev(data, viewPath);
                return successResult(dataStr, viewPath);
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    throw errorsFactory.partialViewNotFound(path.basename(partialViewName), searchedLocations); // [#2.3]

                throw errorsFactory.errorReadingView(viewPath, err);  // [#2.3.1]
            }
        }

        partialViewName = path.normalize(partialViewName);
        // it's just a layout name without any path, start search from the current dir..
        let filePath = path.join(startDir, partialViewName);

        try {
            searchedLocations.push(filePath);
            let cachedData = cache && cache[filePath];

            if (cachedData)
                return cachedData;

            let data = fs.readFileSync(filePath);
            let dataStr = this.addFileNameIfDev(data, filePath);
            return successResult(dataStr, filePath);
        }
        catch (err) {
            if (err.code === 'ENOENT') { // the file doesn't exist, lets see a dir up..
                startDir = startDir.equal(this.viewsDir, true) ? null : path.cutLastSegment(startDir);

                if (!startDir)
                    throw errorsFactory.partialViewNotFound(partialViewName, searchedLocations); // [#2.1].
                else
                    return this.findPartialSync(startDir, partialViewName, searchedLocations, errorsFactory, cache);
            }
            else {
                throw errorsFactory.errorReadingView(filePath, err);  // [#2].
            }
        }

        function successResult(data, filePath) {
            var result = { data, filePath };

            if (cache)
                cache[filePath] = result;

            return result;
        }
    }

    findPartial(startDir, partialViewName, searchedLocations, errorsFactory, done) {
        searchedLocations = searchedLocations || [];

        if (!partialViewName || !partialViewName.length)
            Promise.resolve().then(() => done(errorsFactory.partialLayoutNameExpected()));

        let viewFileExt = path.extname(partialViewName);

        if (!viewFileExt.equal('.' + this.ext))
            partialViewName += '.' + this.ext;

        if (partialViewName[0] === '/' || partialViewName[0] === '.') {
            let viewPath = path.normalize(partialViewName);

            if (partialViewName[0] === '/') { // it's relative to the `views` root folder
                if (!viewPath.startsWithIC(this.viewsDir)) // for linux onlry (in Windows an absolute path cannot start with '/')
                    viewPath = path.join(this.viewsDir, viewPath);
            }
            else if (partialViewName[0] === '.') { // it's relative to the current folder
                viewPath = path.join(startDir, viewPath);
            }

            searchedLocations.push(viewPath);
            fs.readFile(viewPath, (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT')
                        return done(errorsFactory.partialViewNotFound(path.basename(partialViewName), searchedLocations)); // [#TESTME]

                    return done(errorsFactory.errorReadingView(viewPath, err)); // [#TESTME]
                }
                let dataStr = this.addFileNameIfDev(data, viewPath, this.env);
                onSuccess(dataStr, viewPath); // [#TESTME]
            });

            return;
        }

        partialViewName = path.normalize(partialViewName);
        // it's just a layout name without any path, start search from the current dir..
        let filePath = path.join(startDir, partialViewName);
        searchedLocations.push(filePath);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') { // the file doesn't exist, lets see a dir up..
                    startDir = startDir.equal(this.viewsDir, true) ? null : path.cutLastSegment(startDir);

                    if (!startDir)
                        return done(errorsFactory.partialViewNotFound(partialViewName, searchedLocations)); // [#2.5]
                    else
                        return this.findPartial(startDir, partialViewName, searchedLocations, errorsFactory, done);
                }
                return done(errorsFactory.errorReadingView(filePath, err)); // [#2.5.1]
            }
            let dataStr = this.addFileNameIfDev(data, filePath, this.env);
            return onSuccess(dataStr, filePath); // [#2.5.2]
        });

        function onSuccess(data, filePath) {
            done(null, { data, filePath });
        }
    }

    viewStartName() {
        return viewStartName + '.' + this.ext;
    }

    addFileNameIfDev(data, filename) {
        data = String.stripBOM(data.toString());
        let endNL = (data[data.length - 1] === '\n') ? '' : '\n';

        if (dbg.isDebugMode)
            return this.wrapInHtmlComment(filename) + EOL + data + endNL;

        return data + endNL;
    }

    wrapInHtmlComment(text) {
        return `<!-- ${text} -->`;
    }

    // static checkFileReadAccessSync(path){
    //     try{
    //         fs.accessSync(path, fs.constants.R_OK);
    //         return true;
    //     }
    //     catch(exc){
    //         return false;
    //     }
    // }
}
