////////////////////////////////////////////
// This module tests file-error-cases with `code !== ENOENT` via mocking the file-system 
// which cannot be tested in any other way (through real physical files).
////////////////////////////////////////////

console.log("STARTED: RAZOR.test.js");

const server = require('./server.live')({ views: "./razor.test.views" }).app;
var expect = require('chai').expect;
const path = require('path');
const proxyquire = require('proxyquire');
const fs = require('fs');


const Razor = require("../core/Razor");
const RazorError = require('../core/errors/RazorError');
//const ErrorFactory = require('../core/errors/errors');

const locals = server.locals;
const viewsPath = locals.settings.views;
//locals.settings.env = "dev"; set in `launch.json`
//const razor = new Razor(locals);

// Testing view names.
const views = {
    // partial: getViewName("_partial"),
    // renderFile: getViewName(razor.renderFile.name),
    // findViewStart: getViewName(razor.findViewStarts.name),
    // findPartialSync: getViewName(razor.findPartialSync.name),
}

// It doesn't work with prototype methods.
function FsError(triggerFileName, errCode) {
    this.readFile = (filepath, done) => {
        if (endsWith(filepath)) {
            var err = getAccessError(filepath, errCode);
            return done(err);
        }

        fs.readFile(filepath, done);
    }

    this.readFileSync = (filepath) => {
        if (endsWith(filepath))
            throw getAccessError(filepath, errCode);
        return fs.readFileSync(filepath);
    }

    function endsWith(filepath) {
        return filepath.toUpperCase().endsWith(triggerFileName.toUpperCase());
    }
}


//////////////////
// TESTS 

describe("Testing 'Razor' module.", () => {
    let nonExistView = "_nonExisting.raz";
    let viewIndex = "index.raz";
    let viewStart = "_viewStart.raz";
    //let partial = "_partial.raz";


    // [0] : Test `EACCES` error while reading view file.
    {
        let method = Razor.prototype.renderFile.name;
        let errCode = "EACCES";
        it(`[#0 Razor.${method} | ${errCode}]`, (done) => {
            let filePath = viewErrorPath(viewIndex);
            mockRazor(viewIndex, errCode).renderFile(filePath, (err) => {
                expectError(err, viewIndex, method, errCode);
                done();
            });
        });
    }
    // [0.1] : Test `ENOENT` error while reading view file.
    {
        let method = Razor.prototype.renderFile.name;
        let errCode = "ENOENT";
        it(`[#0.1 Razor.${method} | ${errCode}]`, (done) => {
            let filePath = viewErrorPath(viewIndex);
            mockRazor(viewIndex, errCode).renderFile(filePath, (err) => {
                expectError(err, viewIndex, method, errCode);
                done();
            });
        });
    }
    // [1] : Test `EACCES` error while reading view-start file.
    {
        let method = Razor.prototype.findViewStarts.name;
        let errCode = "EACCES";
        it(`[#1 Razor.${method} | ${errCode}]`, (done) => {
            let filePath = viewErrorPath(viewIndex);
            mockRazor(viewStart, errCode).renderFile(filePath, (err) => {
                expectError(err, viewStart, method, errCode);
                done();
            });
        });
    }
    // [2] : Test `EACCES` error while reading partial-view file.
    {
        let method = Razor.prototype.findPartialSync.name;
        let errCode = "EACCES";
        it(`[#2 Razor.${method} | ${errCode}]`, (done) => {
            let filePath = viewErrorPath(viewIndex);
            mockRazor(nonExistView, errCode).renderFile(filePath, (err) => {
                expectError(err, viewIndex, method, errCode);
                done();
            });
        });
    }
    // [2.1] : Test `ENOENT` error while reading partial-view file.
    {
        let method = Razor.prototype.findPartialSync.name;
        let errCode = "ENOENT";
        it(`[#2.1 Razor.${method} | ${errCode}]`, (done) => {
            let filePath = viewErrorPath(viewIndex);
            razor().renderFile(filePath, (err) => {
                expectPartialViewNotFound(err, viewIndex, nonExistView, method);
                done();
            });
        });
    }
    // [2.2] : Test 'partial view name is not set' error.
    {
        let method = Razor.prototype.findPartialSync.name;
        it(`[#2.2 Razor.${method} | empty-partial-filename-error ]`, (done) => {
            let viewPath = viewErrorPath("emptyPartial");
            razor().renderFile(viewPath, (err, html) => {
                expect(err).to.exist;
                expect(html).not.to.exist;
                expect(err.message).to.have.string("Partial layout name is expected.")
                done();
            });
        });
    }
    // [2.3] : Test 'partialViewNotFound' error.
    {
        let method = Razor.prototype.findPartialSync.name;
        let viewName = "partialViewNotFound.raz";
        it(`[#2.3 Razor.${method} | ${viewName} ]`, (done) => {
            let viewPath = viewErrorPath(viewName);
            razor().renderFile(viewPath, (err, html) => {
                expect(err).to.exist;
                expect(html).not.to.exist;
                expect(err).to.be.an.instanceOf(RazorError);
                expect(err.message).to.have.string(`The view "${viewName}" cannot find the partial view "_partial.raz".`);
                done();
            });
        });
    }
    // [2.3.1] : Test 'partialViewNotFound' error.
    {
        let method = Razor.prototype.findPartialSync.name;
        let viewName = "errorReadingView.raz";
        let errorView = "_partial.raz";
        let errCode = "EACCES";
        it(`[#2.3.1 Razor.${method} | ${viewName} ]`, (done) => {
            let viewPath = viewErrorPath(viewName);
            mockRazor(errorView, errCode).renderFile(viewPath, (err, html) => {
                expect(html).not.to.exist;
                expectError(err, viewName, method, errCode);
                done();
            });
        });
    }
    // [2.4] : Test reading partial-view file with relative path.
    {
        let method = Razor.prototype.findPartialSync.name;
        it(`[#2.4 Razor.${method} | Success]`, (done) => {
            let viewPath = viewHomePath(viewIndex);
            razor().renderFile(viewPath, (err, html) => {
                expect(err).not.to.exist;
                expect(html).to.exist;
                expect(html, "[#2.4.1]").to.have.string('<div>/home/partials/_partial.raz</div>');
                expect(html, "[#2.4.2]").to.have.string('<div>/home/partials/_partial-2.raz</div>');
                expect(html, "[#2.4.3]").to.have.string('<div>/home/partials/_partial.html.raz</div>');
                expect(html, "[#2.4.4]").to.have.string('<div>/home/_partial.raz</div>');
                expect(html, "[#2.4.5]").to.have.string('<div>/home/_partial-2.raz</div>');
                done();
            });
        });
    }
    // [2.5] : Test 'findPartial' for '_layout' searching.
    {
        let method = Razor.prototype.findPartial.name;
        let viewName = "findPartial_partialViewNotFound.raz";
        let layoutName = "_absentLayout";
        it(`[#2.5 Razor.${method} | ${viewName} ]`, (done) => {
            let viewPath = viewErrorPath(viewName);
            razor({ layout: layoutName }).renderFile(viewPath, (err, html) => {
                expect(html).not.to.exist;
                expectPartialViewNotFound(err, viewName, `${layoutName}.raz`, null);
                done();
            });
        });
    }

    // [2.5.1] : Test 'findPartial' for '_layout' searching.
    {
        let method = Razor.prototype.findPartial.name;
        let viewName = "findPartial_partialViewNotFound.raz";
        let layoutName = "_absentLayout";
        let errorView = `${layoutName}.raz`;
        let errCode = "EACCES";
        it(`[#2.5.1 Razor.${method} | ${viewName} ]`, (done) => {
            let viewPath = viewErrorPath(viewName);
            mockRazor(errorView, errCode, { layout: layoutName }).renderFile(viewPath, (err, html) => {
                expect(html).not.to.exist;
                expectError(err, viewName, method, errCode);
                done();
            });
        });
    }

    function expectError(err, errorViewName, method, errCode) {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(RazorError);
        expect(err.inner).to.exist;
        expect(err.inner.code).to.equal(errCode);
        expect(err.inner.stack).to.have.string(`at Razor.${method} `);
        expect(err.data.filename).to.be.equal(errorViewName);
    }

    function expectPartialViewNotFound(err, errorView, partialView, method) {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(RazorError);

        if (method)
            expect(err.stack).to.have.string(`at Razor.${method} `);

        expect(err.data.filename).to.be.equal(errorView);
        let expectedMessage = `The view "${errorView}" cannot find the partial view "${partialView}".`;
        expect(err.message).to.have.string(expectedMessage);
    }

}); // "Testing 'Razor' module."



//////////////////
// HELPERS

function razor(model) {
    if (model)
        Object.assign(locals, model);

    return new Razor(locals);
}

function mockRazor(errorFileName, errCode, model) {
    let fsError = new FsError(errorFileName, errCode);
    let RazorError = proxyquire("../core/Razor", { 'fs': fsError });

    if (model)
        Object.assign(locals, model);

    return new RazorError(locals);
}

function viewErrorPath(viewName) {
    return path.join(viewsPath, "errors", viewName);
}

function viewHomePath(viewName) {
    return path.join(viewsPath, "home", viewName);
}

function getAccessError(filepath, errCode) {
    let message = `"${errCode} (Permission denied): An attempt was made to access a file in a way forbidden by its file access permissions: ${filepath}`;
    let error = new Error(message);
    error.code = errCode;
    return error;
}

function viewName(method) {
    return method + "." + razor.viewExt();
}
