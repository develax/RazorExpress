import { expect } from 'chai';
import * as er from "../core/errors/errors.en.mjs"
import * as p from "../core/parser.mjs"
import * as cases from "./cases/env-variables.mjs"
import * as casesHtml from "./cases/html.mjs"
import * as casesInvalidHtml from "./cases/invalid-html.mjs"
import * as casesInvalidModel from "./cases/invalid-model.mjs"
import * as casesModel from "./cases/model.mjs"
import * as casesScope from "./cases/scope.mjs"
import * as casesSection from "./cases/section.mjs"
import * as casesCode from "./cases/code.mjs"

(function () {
    console.clear();
    console.log("=============================================");
    console.log("STARTED: parser.test.js");

    const parser = p.default({ debug: false, mode: "development" });

    describe("INVALID INPUT ARGUMENTS", () => {
        it("should throw an exception if argument is not a string", () => {
            expect(() => parser.compileSync({})).to.throw(er.templateShouldBeString);
        });
        it("should return an empty string if the argument was an empty string", () => {
            expect(parser.compileSync({ template: '', filePath: "Empty string test" })).to.be.empty;
        });
    });

    describe("ENVIRONMENTAL VARIABLES VISIBILITY CASES", () => {
        describe("HIDDEN", () => {
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

    describe("TEST BROWSER SIGNATURE", () => {
        it("Test 1", () => {
            let result = parser.compileSync("", { x: 1 });
            expect(result).to.equal("");
        });
    });

    describe("HTML CASES", () => {
        describe("VALID HTML", () => {
            let cases = casesHtml;

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ template: c.template, filePath: c.name });
                    expect(result).to.equal(c.expected);
                });
            }
        });

        describe("INVALID HTML", () => {
            let cases = casesInvalidHtml;

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileSync({ template: c.template, filePath: c.name });
                    expect(result).to.throw(c.error);
                });
            }
        });
    });

    describe("MODEL & SCOPE & EXPRESSION CASES", () => {
        describe("VALID MODELS", () => {
            let cases = casesModel;

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ template: c.template, model: c.model, filePath: c.name });
                    expect(c.expected).to.equal(result);
                });
            }
        });

        describe("INVALID MODELS", () => {
            let cases = casesInvalidModel;

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = () => parser.compileSync({ template: c.template, filePath: c.name });
                    expect(result).to.throw(c.error);
                });
            }
        });

        describe("SCOPES", () => {
            let cases = casesScope;

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    let result = parser.compileSync({ template: c.template, model: c.model, filePath: c.name });
                    expect(c.expected).to.equal(result);
                });
            }
        });
    });

    describe("CODE-BLOCKS CASES", () => {
        describe("VALID", () => {
            let cases = casesCode;

            for (let i = 0; i < cases.length; i++) {
                let c = cases[i];
                it(c.name, () => {
                    if (typeof c.expected !== 'undefined') {
                        let result = parser.compileSync({ template: c.template, model: c.model, filePath: c.name });
                        expect(result).to.be.equal(c.expected);
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
            let cases = casesSection;

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

})();

