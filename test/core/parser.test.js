(function () {
    var expect = require('chai').expect;
    const parser = require('../../core/parser')({ debug: true });
    const er = require('../../core/localization/errors').parser;

    describe("INVALID INPUT ARGUMENTS", () => {
        it("should throw an exception if argument is not a string", () => {
            expect(parser.compileHtml).to.throw(er.rawArgumentShouldBeString);
        });
        it("should return an empty string if the argument was an empty string", () => {
            expect(parser.compileHtml('')).to.be.empty;
        });
    });

    describe("HTML CASES", () => {
        describe("VALID HTML", () => {
            let cases = require('./_cases/html');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileHtml(c.template);
                    expect(result).to.equal(c.expected);
                });
            }
        });

        describe("INVALID HTML", () => {
            let cases = require('./_cases/invalid-html');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileHtml(c.template);
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
                    let result = parser.compileHtml(c.template, c.model);
                    expect(c.expected).to.equal(result);
                });
            }
        });

        describe("INVALID MODELS", () => {
            let cases = require('./_cases/invalid-model');

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileHtml(c.template);
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
                    let result = parser.compileHtml(c.template, c.model);
                    expect(c.expected).to.equal(result);
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
                    let result = parser.compileHtml(c.template, c.model);
                    expect(c.expected).to.equal(result);
                });
            }
        });
    });
 
})();

