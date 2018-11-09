(function () {
    'use strict';
    const ext = "jshtml", viewStartName = '_viewStart';

    module.exports = {
        initEngine: function (expressApp, opt) {
            expressApp.engine(ext, renderFile);
            //expressApp.set('views', './views'); // specify the views directory
            expressApp.set('view engine', ext);
        },
        __express: renderFile
    };

    require('./utils');
    const fs = require('fs');
    const path = require('path');
    const parserInit = require('./parser');
    const er = require('./errors/errors').parser;
    //require('./core/utils');
    //const fs = require('fs');
    //const path = require('path');
    //const parser = require('./core/parser')();
    //const er = require('./core/localization/errors').parser;

    function renderFile(filepath, options, done) {
        let parser = parserInit({ mode: "dev" });
        filepath = path.normalize(filepath).toLowerCase();
        //let fileName = path.fileName(filepath);
        let viewsPath = path.normalize(options.settings.views).toLowerCase();

        if (!filepath.startsWith(viewsPath))
            filepath = path.join(viewsPath, filepath);

        if (!path.extname(filepath))
            filepath += '.' + viewExt(options);

        fs.readFile(filepath, (err, data) => {
            if (err)
                return done(err);

            let currentDir = path.dirname(filepath);
            let viewsDir = path.normalize(options.settings.views).toLowerCase();

            readViewStarts(currentDir, viewsDir, null, (err, buff) => {
                if (err)
                    return done(err);

                let compileArgs = {
                    filePath: filepath,
                    jsHtml: buff.toString() + data.toString(),
                    model: options,
                    findPartial: getFindPartialFunc(viewsDir, options),
                    findPartialSync: getFindPartialSyncFunc(viewsDir, options)
                };

                parser.compile(compileArgs, (err, html) => {
                    if (err)
                        return done(err);
                    done(null, html);
                });
            });
        });
    }

    function readViewStarts(startDir, viewsDir, buffer, done) {
        const fileName = "_viewStart.jshtml";
        const filePath = path.join(startDir, fileName);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code !== 'ENOENT') return done(err);
            }
            else {
                buffer = (buffer) ? Buffer.concat([data, buffer], data.length + buffer.length) : data; // the `concat` order is important here!
            }

            startDir = (startDir === viewsDir) ? null : path.cutLastSegment(startDir);

            if (startDir)
                return readViewStarts(startDir, viewsDir, buffer, done);

            return done(null, buffer);
        });
    }

    function findPartialSync(startDir, viewsDir, partialName, opt, searchedLocations) {
        partialName = path.normalize(partialName).toLowerCase();

        if (!partialName || !partialName.length)
            Promise.resolve().then(() => done("Invalid layout name."));

        if (!path.extname(partialName))
            partialName += '.' + viewExt(opt);

        if (partialName[0] === path.sep || partialName[0] === '.') { // it's full (in linux) or relative path
            if (!partialName.startsWith(viewsDir))
                partialName = path.join(viewsDir, partialName);

            try {
                searchedLocations.push(partialName);
                let data = fs.readFileSync(partialName);
                return successResult(data.toString(), partialName);
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    throw Error(notFoundMessage());
                throw err;
            }
        }

        // it's just a layout name without any path, start search from the current dir..
        let filePath = path.join(startDir, partialName);

        try {
            searchedLocations.push(filePath);
            let data = fs.readFileSync(filePath);
            return successResult(data.toString(), filePath);
        }
        catch (err) {
            if (err.code === 'ENOENT') { // the file doesn't exist, lets see a dir up..
                startDir = (startDir === viewsDir) ? null : path.cutLastSegment(startDir);

                if (!startDir)
                    throw new Error(notFoundMessage());
                else
                    return findPartialSync(startDir, viewsDir, partialName, opt, searchedLocations);
            }
            else {
                throw err;
            }
        }

        function successResult(data, filePath) {
            return { data, filePath };
        }

        function notFoundMessage() {
            return partialViewNotFoundMessage(partialName, searchedLocations);
        }
    }

    function findPartial(startDir, viewsDir, partialName, opt, searchedLocations, done) {
        partialName = path.normalize(partialName).toLowerCase();

        if (!partialName || !partialName.length)
            Promise.resolve().then(() => done("Invalid layout name."));

        if (!path.extname(partialName))
            partialName += '.' + viewExt(opt);

        if (partialName[0] === path.sep || partialName[0] === '.') { // it's full (in linux) or relative path
            if (!partialName.startsWith(viewsDir))
                partialName = path.join(viewsDir, partialName);

            searchedLocations.push(partialName);
            fs.readFile(partialName, (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT')
                        return done(notFoundMessage());
                    return done(err);
                }
                onSuccess(data.toString(), partialName);
            });

            return;
        }

        // it's just a layout name without any path, start search from the current dir..
        let filePath = path.join(startDir, partialName);
        searchedLocations.push(filePath);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') { // the file doesn't exist, lets see a dir up..
                    startDir = (startDir === viewsDir) ? null : path.cutLastSegment(startDir);

                    if (!startDir)
                        return done(notFoundMessage());
                    else
                        return findPartial(startDir, viewsDir, partialName, opt, searchedLocations, done);
                }
                return done(err);
            }
            return onSuccess(data.toString(), filePath);
        });

        function onSuccess(data, filePath) {
            done(null, { data, filePath });
        }

        function notFoundMessage() {
            return partialViewNotFoundMessage(partialName, searchedLocations);
        }
    }

    function partialViewNotFoundMessage(partialName, searchedLocations) {
        let errorMessage = `The partial view "${partialName}" was not found from:\n${searchedLocations.shift()}\n\nThe following locations were searched:\n${searchedLocations.join("\n")}\n\n`;
        return errorMessage;
    }

    function getFindPartialFunc(viewsDir, options) {
        return (layoutName, filePath, done) => {
            var startDir = path.dirname(filePath);
            findPartial(startDir, viewsDir, layoutName, options, [filePath], done);
        };
    }

    function getFindPartialSyncFunc(viewsDir, options) {
        return (layoutName, filePath) => {
            var startDir = path.dirname(filePath);
            return findPartialSync(startDir, viewsDir, layoutName, options, [filePath]);
        };
    }

    function viewExt(options) {
        return options.settings['view engine'] || ext;
    }

})();



