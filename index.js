'use strict';

//const parser = require('./core/parser')({ debug: false, mode: "dev" });

module.exports = {
    // https://expressjs.com/en/guide/using-template-engines.html
    // https://www.npmjs.com/package/hbs
    __express: renderFile,
    renderFile: renderFile,
    render: getParser().compileSync,
    register: registerRazorEngine,
    handleErrors: handleErrors
};

const Razor = require('./core/Razor');
var razor, parser, _ext = "raz";


function renderFile(filepath, options, done) {
    options.ext = _ext;

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

function registerRazorEngine(app, ext = _ext) {
    _ext = ext;
    app.engine(_ext, renderFile);
    app.set('view engine', _ext);
}

function handleErrors(app, errorCode) {
    const dbg = require('./core/dbg/debugger');
    app.use(appErrorHandler);

    function appErrorHandler(err, req, res, next) {
        if (res.headersSent)
            return next(err); // must

        var env = app.get('env');

        if (dbg.isDebugMode(env) && err.isRazorError) {
            var errorHtml = err.html();
            res.status(errorCode || 500);
            res.send(errorHtml);
            return;
        }

        return next(err);
    }
}

