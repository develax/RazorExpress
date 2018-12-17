'use strict';

//const parser = require('./core/parser')({ debug: false, mode: "dev" });

module.exports = {
    // https://expressjs.com/en/guide/using-template-engines.html
    // https://www.npmjs.com/package/hbs
    __express: renderFile,
    renderFile: renderFile,
    render: getParser().compileSync,
    /**
     * @deprecated Since version "0.0.66". Will be deleted in version "1.0.0". Use 'render' instead.
     */
    compileSync: function () {
        console.warn("The 'compileSync' method is deprecated. Will be deleted in version '1.0.0'. Use 'render' instead.");
        var parser = getParser();
        parser.compileSync.apply(parser, arguments);
    },
    register: registerRazorEngine,
    handleErrors: handleErrors
};

const Razor = require('./core/Razor');
const RazorError = require('./core/errors/RazorError');
var razor, parser;

function renderFile(filepath, options, done) {
    if (!razor)
        razor = new Razor(options);

    razor.renderFile(filepath, done);
}

function getParser() {
    if (!parser) {
        var env = process && process.env.NODE_ENV;
        parser = require('./core/parser')({ debug: false, mode: env });
    }
    return parser;
}

function registerRazorEngine(app) {
    const ext = "raz";
    app.engine(ext, renderFile);
    app.set('view engine', ext);
}

function handleErrors(app, errorCode, mode) {
    mode = mode || "development";
    app.use(appErrorHandler);

    function appErrorHandler(err, req, res, next) {
        if (res.headersSent)
            return next(err); // must

        var env = app.get('env');

        if (env === mode && err instanceof RazorError) {
            var errorHtml = err.html();
            res.status(errorCode || 500);
            res.send(errorHtml);
            return;
        }

        return next(err);
    }
}

