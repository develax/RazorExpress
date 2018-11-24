'use strict';

//const parser = require('./core/parser')({ debug: false, mode: "dev" });

module.exports = {
    // https://expressjs.com/en/guide/using-template-engines.html
    // https://www.npmjs.com/package/hbs
    __express: renderFile,
    compileFile: renderFile,
    compile: getParser().compile,
    compileSync: getParser().compileSync,
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

function getParser(){
    if (!parser){
        var env = process.env.NODE_ENV;
        parser = require('./core/parser')({ debug: false, mode: env });
    }
    return parser;
}

function registerRazorEngine(app) {
    const ext = "raz";
    app.engine(ext, renderFile);
    app.set('view engine', ext);
}

function handleErrors(app, errorCode, mode){
    mode = mode || "dev";
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

