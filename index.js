'use strict';
const ext = "jshtml";


module.exports = {
    initEngine: function (expressApp, opt) {
        expressApp.engine(ext, renderFile);
        //expressApp.set('views', './views'); // specify the views directory
        expressApp.set('view engine', ext);
    },
    // https://expressjs.com/en/guide/using-template-engines.html
    // https://www.npmjs.com/package/hbs
    __express: renderFile
};

const Razor = require('./core/Razor')

function renderFile(filepath, options, done) {
    let razor = new Razor(options);
    razor.renderFile(filepath, done);
}