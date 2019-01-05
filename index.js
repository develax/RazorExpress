'use strict';

const dbg = require('./core/dbg/debugger'); 
const Razor = require('./core/Razor');
var razor, parser, _ext = "raz";

module.exports = {
    // https://expressjs.com/en/guide/using-template-engines.html
    // https://www.npmjs.com/package/hbs
    __express: renderFile,
    renderFile: renderFile,
    render: getParser().compileSync,
    register: registerRazorEngine,
    handleErrors: handleErrors,
    debug: isDebugMode()
};

function renderFile(filepath, options, done) {
    options.ext = _ext;

    if (!razor)
        razor = new Razor(options);

    razor.renderFile(filepath, done);
}

function getParser() {
    if (!parser) {
        var env = getEnv();
        parser = require('./core/parser')({ debug: false, mode: env });
    }
    return parser;
}

function registerRazorEngine(app, ext = _ext) {
    _ext = ext;
    app.engine(_ext, renderFile);
    app.set('view engine', _ext);
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

function isDebugMode(){
    return dbg.isDebugMode(getEnv());
}

function getEnv(){
    return process && process.env.NODE_ENV;
}