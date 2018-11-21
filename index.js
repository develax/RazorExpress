'use strict';

//const parser = require('./core/parser')({ debug: false, mode: "dev" });

module.exports = {

    // https://expressjs.com/en/guide/using-template-engines.html
    // https://www.npmjs.com/package/hbs
    __express: renderFile,
    parser: getParser
};

const Razor = require('./core/Razor')

function renderFile(filepath, options, done) {
    let razor = new Razor(options);
    razor.renderFile(filepath, done);
}

function getParser(env){
    return require('./core/parser')({ debug: false, mode: env });
}