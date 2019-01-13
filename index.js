'use strict';

const dbg = require('./core/dbg/debugger');
const Razor = require('./core/Razor');
var parser;
var settings = { ext: 'raz' };

module.exports = {
    __express: renderFile,
    set ext(val){
        settings.ext = val;
    },
    register,
    renderFile,
    render: getParser().compileSync,
    handleErrors,
    debug: isDebugMode()
}


function register(app, ext) {
    settings.ext = ext = settings.ext || ext;
    app.engine(ext, renderFile);
    app.set('view engine', ext);
}

function renderFile(filepath, options, done) {
    const razorOpts = { ext: settings.ext };
    const razor = new Razor(options, razorOpts);
    razor.renderFile(filepath, done);
}

function getParser() {
    if (!parser) {
        var env = getEnv();
        parser = require('./core/parser')({ debug: false, mode: env });
    }
    return parser;
}

function handleErrors(app, errorCode) {
    app.use(appErrorHandler);

    function appErrorHandler(err, req, res, next) {
        if (res.headersSent)
            return next(err); // must

        if (isDebugMode() && err.isRazorError) {
            var errorHtml = err.html();
            res.status(errorCode || 500);
            res.send(errorHtml);
            return;
        }

        return next(err);
    }
}

function isDebugMode() {
    return dbg.isDebugMode(getEnv());
}

function getEnv() {
    return process && process.env.NODE_ENV;
}
