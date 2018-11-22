'use strict';

//const parser = require('./core/parser')({ debug: false, mode: "dev" });

module.exports = {

    // https://expressjs.com/en/guide/using-template-engines.html
    // https://www.npmjs.com/package/hbs
    __express: renderFile,
    compileFile: renderFile,
    compile: getParser().compile,
    compileSync: getParser().compileSync
};

const Razor = require('./core/Razor')

function renderFile(filepath, options, done) {
    let razor = new Razor(options);
    razor.renderFile(filepath, done);
}

var parser;

function getParser(){
    if (!parser){
        var env = process.env.NODE_ENV;
        parser = require('./core/parser')({ debug: false, mode: env });
    }
    return parser;
}