(function () {
    console.clear();
    console.log("STARTED: parser.test.js");

    var expect = require('chai').expect;
    const parser = require('../../core/parser')({ debug: false, env: "dev" });
    const er = new require('../../core/localization/errors');


    describe("INVALID INPUT ARGUMENTS", () => {
        it("should throw an exception if argument is not a string", () => {
            expect(() => parser.compileSync({})).to.throw(er.rawArgumentShouldBeString);
        });
        it("should return an empty string if the argument was an empty string", () => {
            expect(parser.compileSync({ jsHtml: '' })).to.be.empty;
        });
    });

    describe("HTML CASES", () => {
        describe("VALID HTML", () => {
            let cases = require('./_cases/html');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ jsHtml: c.template });
                    expect(result).to.equal(c.expected);
                });
            }
        });

        describe("INVALID HTML", () => {
            let cases = require('./_cases/invalid-html');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileSync({ jsHtml: c.template });
                    expect(result).to.throw(c.error);
                });
            }
        });
    });

    describe("MODEL & EXPRESSION CASES", () => {
        describe("VALID MODELS", () => {
            let cases = require('./_cases/model');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ jsHtml: c.template, model: c.model });
                    expect(c.expected).to.equal(result);
                });
            }
        });

        describe("INVALID MODELS", () => {
            let cases = require('./_cases/invalid-model');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileSync({ jsHtml: c.template });
                    expect(result).to.throw(c.error);
                });
            }
        });
    });

    describe("CODE-BLOCKS CASES", () => {
        describe("VALID", () => {
            let cases = require('./_cases/code');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    if (typeof c.expected !== 'undefined') {
                        let result = parser.compileSync({ jsHtml: c.template, model: c.model });
                        expect(c.expected).to.equal(result);
                    }
                    else {
                        let result = () => parser.compileSync({ jsHtml: c.template });
                        expect(result).to.throw(c.error);
                    }
                });
            }
        });
    });

    describe("SECTIONS CASES", () => {
        describe("VALID", () => {
            let cases = require('./_cases/section');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    if (c.expected) {
                        let result = parser.compileSync({ jsHtml: c.template, model: c.model });
                        expect(c.expected).to.equal(result);
                    }
                    else {
                        let result = () => parser.compileSync({ jsHtml: c.template });
                        expect(result).to.throw(c.error);
                    }
                });
            }
        });
    });

    describe("ENVIRONMENTAL VARIABLES VISIBILITY CASES", () => {
        describe("HIDDEN", () => {
            let cases = require('./_cases/env-variables');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ jsHtml: c.template, model: c.model });
                    expect(c.expected).to.equal(result);
                });
            }
        });
    });

})();

