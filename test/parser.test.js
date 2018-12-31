(function () {
    console.clear();
    console.log("=============================================");
    console.log("STARTED: parser.test.js");

    var expect = require('chai').expect;
    const parser = require('../core/parser')({ debug: false, mode: "development" });
    const er = new require('../core/errors/errors');

    describe("INVALID INPUT ARGUMENTS", () => {
        it("should throw an exception if argument is not a string", () => {
            expect(() => parser.compileSync({})).to.throw(er.templateShouldBeString);
        });
        it("should return an empty string if the argument was an empty string", () => {
            expect(parser.compileSync({ template: '', filePath: "Empty string test" })).to.be.empty;
        });
    });

    describe("TEST BROWSER SIGNATURE", () => {
        it("Test 1", () => {
            let result = parser.compileSync("", { x: 1 });
            expect(result).to.equal("");
        });
    });

    describe("HTML CASES", () => {
        describe("VALID HTML", () => {
            let cases = require('./cases/html');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ template: c.template, filePath: c.name });
                    expect(result).to.equal(c.expected);
                });
            }
        });

        describe("INVALID HTML", () => {
            let cases = require('./cases/invalid-html');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileSync({ template: c.template, filePath: c.name });
                    expect(result).to.throw(c.error);
                });
            }
        });
    });

    describe("MODEL & EXPRESSION CASES", () => {
        describe("VALID MODELS", () => {
            let cases = require('./cases/model');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ template: c.template, model: c.model, filePath: c.name });
                    expect(c.expected).to.equal(result);
                });
            }
        });

        describe("INVALID MODELS", () => {
            let cases = require('./cases/invalid-model');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileSync({ template: c.template, filePath: c.name });
                    expect(result).to.throw(c.error);
                });
            }
        });
    });

    describe("CODE-BLOCKS CASES", () => {
        describe("VALID", () => {
            let cases = require('./cases/code');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    if (typeof c.expected !== 'undefined') {
                        let result = parser.compileSync({ template: c.template, model: c.model, filePath: c.name });
                        expect(c.expected).to.equal(result);
                    }
                    else {
                        let result = () => parser.compileSync({ template: c.template, filePath: c.name });
                        expect(result).to.throw(c.error);
                    }
                });
            }
        });
    });

    describe("SECTIONS CASES", () => {
        describe("VALID", () => {
            let cases = require('./cases/section');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    if (c.expected) {
                        let result = parser.compileSync({ template: c.template, model: c.model, filePath: c.name });
                        expect(c.expected).to.equal(result);
                    }
                    else {
                        let result = () => parser.compileSync({ template: c.template, filePath: c.name });
                        expect(result).to.throw(c.error);
                    }
                });
            }
        });
    });

    describe("ENVIRONMENTAL VARIABLES VISIBILITY CASES", () => {
        describe("HIDDEN", () => {
            let cases = require('./cases/env-variables');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ template: c.template, model: c.model, filePath: c.name });
                    expect(c.expected).to.equal(result);
                });
            }
        });
    });

})();

