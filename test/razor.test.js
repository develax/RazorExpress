////////////////////////////////////////////
// This module tests file-error-cases with `code !== ENOENT` via mocking the file-system 
// which cannot be tested in any other way (through real physical files).
////////////////////////////////////////////

console.log("STARTED: RAZOR.test.js");

const server = require('./server.live')({ views: "./razor.test.views" }).app;
const chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
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
                expect(err.message).to.have.string(`${viewName}" cannot find the partial view "_partial.raz".`);
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
                expectLayoutViewNotFound(err, viewName, `${layoutName}.raz`, null);
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

    ///////////////////
    // SECTIONS
    //////////////////

    describe(`SECTIONS`, () => {
        describe(`[#3 : declare & render section within one view]`, () => {
            let okPath = "sections/ok/";
            let errorPath = "sections/error/";
            // [#3.1] : correct order
            {
                let viewName = "oneViewSection.raz";
                let filePath = joinViewPath(okPath, viewName);
                it(`[#3.1 | OK: correct order ]`, (done) => {
                    razor({ h1: "HEADERS" }).renderFile(filePath, (err, html) => {
                        expect(err).not.to.exist;
                        expect(html).to.exist;
                        expect(html).to.have.string("<h1>HEADERS</h1>");
                        done();
                    });
                });
            }
            // [#3.1.1] : not found and not required
            {
                let viewName = "notRequired.raz";
                let filePath = joinViewPath(okPath, viewName);
                it(`[#3.1.1 | OK: not found and not required ]`, (done) => {
                    razor().renderFile(filePath, (err, html) => {
                        expect(err).not.to.exist;
                        expect(html).to.exist;
                        done();
                    });
                });
            }
            // [#3.2] : reverse order
            {
                let viewName = "oneViewSectionReverseOrder.raz";
                let filePath = joinViewPath(errorPath, viewName);
                it(`[#3.2 | ERROR: reverse order ]`, (done) => {
                    razor({ h1: "STYLES" }).renderFile(filePath, (err, html) => {
                        expect(html).not.to.exist;
                        expect(err).to.exist;
                        expectError2({
                            err, 
                            errMes: `You try to render the section 'Headers' from the '${filePath}' view. This section has not been compiled yet. Make sure it is defined before the '@Html.section' method is called.`,
                        });
                        done();
                    });
                });
            }
            // [#3.3] : section is not found
            {
                let viewName = "sectionIsNotFound.raz";
                let filePath = joinViewPath(errorPath, viewName);
                let sectionName = "Styles";
                it(`[#3.3 | ERROR: section is not found ]`, (done) => {
                    razor({ sectionName }).renderFile(filePath, (err, html) => {
                        expect(html).not.to.exist;
                        expect(err).to.exist;
                        expectError2({
                            err, 
                            errMes: `View '${filePath}' requires the section '${sectionName}' which cannot be found.`,
                        });
                        done();
                    });
                });
            }
            // [#3.4] : section is already rendered
            {
                let viewName = "sectionAlreadyRendered.raz";
                let filePath = joinViewPath(errorPath, viewName);
                let sectionName = "Headers";
                it(`[#3.4 | ERROR: section is already rendered ]`, (done) => {
                    razor().renderFile(filePath, (err, html) => {
                        expect(html).not.to.exist;
                        expect(err).to.exist;
                        expectError2({
                            err, 
                            errMes: `Sections named '${sectionName}' has already been rendered by '${filePath}'. There is an atempt to rendered it again by '${filePath}'.`,
                        });
                        done();
                    });
                });
            }
            // [#3.5] : section is vever rendered
            {
                let viewName = "sectionNeverRendered.raz";
                let filePath = joinViewPath(errorPath, viewName);
                let sectionName = "Headers";
                it(`[#3.5 | ERROR: section is vever rendered ]`, (done) => {
                    razor().renderFile(filePath, (err, html) => {
                        expect(html).not.to.exist;
                        expect(err).to.exist;
                        expectError2({
                            err, 
                            errMes: `Section '${sectionName}' in '${filePath}' has never been rendered. If a section exists it must be rendered.`,
                        });
                        done();
                    });
                });
            }
        });
        describe(`[#4 : declare & render section in different views]`, () => {
            // [#4.1] : section from partial views is rendered only once
            {
                let viewName = "index.raz";
                let filePath = joinViewPath("sections", viewName);
                let testText = "This-is-a-partial-section";
                it(`[#4.1 | OK: section from partial views is rendered only once ]`, (done) => {
                    razor({ text: testText }).renderFile(filePath, (err, html) => {
                        expect(err).not.to.exist;
                        expect(html).to.exist;
                        let count = html.split(testText).length - 1;
                        expect(count).to.equal(1);
                        done();
                    });
                });
            }
            // [#4.2] : sections with the same name from different views are all rendered
            {
                let viewName = "index.raz";
                let filePath = joinViewPath("sections", viewName);
                let testText = "This-is-a-partial-section-1";
                let testText2 = "This-is-a-partial-section-2";
                it(`[#4.2 | OK: sections with the same name from different views are all rendered ]`, (done) => {
                    razor({ text: testText, text2: testText2 }).renderFile(filePath, (err, html) => {
                        expect(err).not.to.exist;
                        expect(html).to.exist;
                        let count1 = html.split(testText).length - 1;
                        expect(count1).to.equal(1);
                        let count2 = html.split(testText2).length - 1;
                        expect(count2).to.equal(1);
                        done();
                    });
                });
            }
        });
    });

    function expectError(err, errorViewName, method, errCode) {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(RazorError);
        expect(err.inner).to.exist;
        expect(err.inner.code).to.equal(errCode);
        expect(err.inner.stack).to.have.string(`at Razor.${method} `);
        expect(err.data.filename).to.endsWith(errorViewName);
    }

    function expectError2({err, errMes, method}) {
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(RazorError);

        if (method)
            expect(err.stack).to.have.string(`at Razor.${method} `);

        if (errMes)
            expect(err.message).to.have.string(errMes);
        //expect(err.data.filename).to.endsWith(errorViewName);
    }

    function expectLayoutViewNotFound(err, errorView, partialView, method) {
        expectViewNotFound(err, errorView, method);
        let expectedMessage = `${errorView}" cannot find the layout view "${partialView}".`;
        expect(err.message).to.have.string(expectedMessage);
    }

    function expectPartialViewNotFound(err, errorView, partialView, method) {
        expectViewNotFound(err, errorView, method);
        let expectedMessage = `${errorView}" cannot find the partial view "${partialView}".`;
        expect(err.message).to.have.string(expectedMessage);
    }

    function expectViewNotFound(err, errorView, method){
        expect(err).to.exist;
        expect(err).to.be.an.instanceOf(RazorError);

        if (method)
            expect(err.stack).to.have.string(`at Razor.${method} `);

        expect(err.data.filename).to.endsWith(errorView);
    }

}); // "Testing 'Razor' module."



//////////////////
// HELPERS

const DefaultContext = require('../core/RazorContext');
const razorOpts = { ext: 'raz' }

function razor(model) {
    if (model)
        Object.assign(locals, model);

    return new Razor(locals, razorOpts);
}

function mockRazor(errorFileName, errCode, model) {
    let fsError = new FsError(errorFileName, errCode);
    let RazorError = proxyquire("../core/Razor", { 'fs': fsError });

    if (model)
        Object.assign(locals, model);

    return new RazorError(locals, razorOpts);
}

function joinViewPath(viewPath, viewName) {
    return path.join(viewsPath, viewPath, viewName);
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
