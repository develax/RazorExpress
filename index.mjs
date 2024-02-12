const dbg = (await import('./core/dbg/debugger.mjs'));
dbg.setDebugMode(isDebugMode());
import {Razor} from "./core/Razor.mjs"
export const HtmlString = (await import('./core/HtmlString.mjs')).default;;
var parser;
var settings = { ext: 'raz' };


export const __express = renderFile;
export const render = getParser().then(x=>x.compileSync);
export const renderAsync = getParser().then(x=>x.compileAsync);
export const debug = dbg.isDebugMode;
export var beforeRender = function (){}

// module.exports = {
//     set ext(val) {
//         settings.ext = val || settings.ext;
//     },
//     get ext() {
//         return settings.ext;
//     },
//     set beforeRender(func){
//         if (typeof func !== "function")
//             throw new Error('`beforeRender` must be a function.');

//         settings.beforeRender = func;
//     },
//     get beforeRender(){
//         return settings.beforeRender;
//     },
//}

export function register(app, ext) {
    settings.ext = ext = settings.ext || ext;
    app.engine(ext, renderFile);
    app.set('view engine', ext);
}

export function renderFile(filepath, options, done) {
    settings.beforeRender && settings.beforeRender(options);
    const razorOpts = { ext: settings.ext };
    const razor = new Razor(options, razorOpts);
    razor.renderFile(filepath, done);
}

export function renderFileAsync(filepath, options) {
    settings.beforeRender && settings.beforeRender(options);
    const razorOpts = { ext: settings.ext };
    const razor = new Razor(options, razorOpts);
    return razor.renderFileAsync(filepath);
}

export async function getParser() {
    if (!parser) {
        var env = getEnv();
        var parser = (await import("./core/parser.mjs")).default({ debug: false, mode: env });
    }
    return parser;
}

export function handleErrors(app, errorCode) {
    app.use(appErrorHandler);

    function appErrorHandler(err, req, res, next) {
        if (res.headersSent)
            return next(err); // must

        if (dbg.isDebugMode && err.isRazorError) {
            var errorHtml = err.html();
            res.status(errorCode || 500);
            res.send(errorHtml);
            return;
        }

        return next(err);
    }
}

export function isDebugMode() {
    return getEnv() !== "production"
}

export function getEnv() {
    return process && process.env.NODE_ENV;
}
