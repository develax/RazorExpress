'use strict';

const dbg = require('./core/dbg/debugger');
const Razor = require('./core/Razor');
const DefaultContext = require('./core/RazorContext');
var razor, parser, _requestContext;
var isContextSet = false;
var _settings = { ext: 'raz', context: DefaultContext };

module.exports = {
    __express: renderFile,
    setup,
    initContext,
    renderFile,
    render: getParser().compileSync,
    handleErrors,
    debug: isDebugMode()
}

function setup(app, settings) {
    _settings = Object.assign(_settings, settings);

    if (_settings.context)
        initContext(app, _settings.context);

    if (_settings.register || _settings.ext !== "raz")
        register(app, _settings.ext)
}

function register(app, ext) {
    app.engine(ext, renderFile);
    app.set('view engine', ext);
}

function renderFile(filepath, options, done) {
    const razorOpts = { ext: _settings.ext, context: _requestContext }

    if (!razor)
        razor = new Razor(options, razorOpts);

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

function initContext(app, context) {
    if (isContextSet)
        throw new Error('The context has been initialized already.');

    const Context = context;

    app.use((req, res, next) => {
        _requestContext = new Context(req);
        next();
    });
}