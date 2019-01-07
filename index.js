'use strict';

const dbg = require('./core/dbg/debugger');
const Razor = require('./core/Razor');
const DefaultContext = require('./core/RazorContext');
var razor, parser, _ext = "raz", _app, _settings, _requestContext;
var isContextSet = false;

module.exports = function (app, settings) {
    _app = app;
    _settings = Object.assign({ ext: 'raz', context: DefaultContext }, settings);
    initContext();

    return {
        register: registerRazorEngine,
        __express: renderFile,
        renderFile: renderFile,
        render: getParser().compileSync,
        handleErrors: handleErrors,
        debug: isDebugMode()
    };
}

function renderFile(filepath, options, done) {
    const razorOpts = { ext: _settings.ext, context: _requestContext }

    if (!razor)
        razor = new Razor(options, razorOpts);

    razor.renderFile(filepath, done);
}

function registerRazorEngine() {
    _ext = _settings.ext;
    _app.engine(_ext, renderFile);
    _app.set('view engine', _ext);
}


function getParser() {
    if (!parser) {
        var env = getEnv();
        parser = require('./core/parser')({ debug: false, mode: env });
    }
    return parser;
}

function handleErrors(errorCode) {
    _app.use(appErrorHandler);

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

function initContext() {
    if (isContextSet)
        throw new Error('The context has been initialized already.');

    const Context = _settings.context;

    _app.use((req, res, next) => {
        _requestContext = new Context(req);
        next();
    });
}