console.log("> UTILS.test.js");

import { Utils } from "../core/utils.mjs"
import { expect } from "chai";

describe("Utils.js", () => {
    describe(`String.prototype.${String.prototype.equal.name}`, () => {
        it('Case sensitive 1', () => {
            let result = "Abc123".equal("Abc123");
            expect(result).to.be.true;
        });

        it('Case sensitive 2', () => {
            let result = "aBC123".equal("Abc123");
            expect(result).to.be.false;
        });

        it('Ignore case', () => {
            let result = "AbC123".equal("aBc123", true);
            expect(result).to.be.true;
        });

        it('Ignore case + Current locale', () => {
            let result = "AbC123".equal("aBc123", true);
            expect(result).to.be.true;
        });

        it('Turkish test 1 (ignore case, en-US)', () => {
            let result = "IiiI".equal("ıiİI", true, "en-US");
            expect(result).to.be.false;
        });

        it('Turkish test 2 (ignore case, tr-TR)', () => {
            let result = "IiiI".equal("ıiİI", true, "tr-TR");
            expect(result).to.be.true;
        });

        it('Turkish test 3 (case sensitive, tr-TR)', () => {
            let result = "IiiI".equal("ıiİI", false, "tr-TR");
            expect(result).to.be.false;
        });

        it('null-test-1', () => {
            let result = "AAA".equal(null);
            expect(result).to.be.false;
        });

        it('null-test-2', () => {
            let result = String.equal(null, "BBB");
            expect(result).to.be.false;
        });

        it('null-test-3', () => {
            let result = String.equal(null, null);
            expect(result).to.be.false;
        });
    });
});

