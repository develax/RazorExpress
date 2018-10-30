//require('../utils');

var errors = {
    parser: {
        jshtmlShouldBeString: '[jshtml] argument should be a string',
        endOfFileFoundAfterAtSign: 'End-of-file was found after the "@" character. "@" must be followed by a valid code block. If you want to output an "@", escape it using the sequence: "@@"',
        unexpectedCharacter: function (ch, lineNum, posNum, line) {
            return `unexpected character '${ch}' at line ${lineNum + 1} pos ${posNum + 1}: '${line}' <--`;
        },
        notValidStartOfCodeBlock(ch, lineNum, posNum) {
            return `"${ch}" is not valid at the start of a code block at line ${lineNum} pos ${posNum}. Only identifiers, keywords, "(" and "{" are valid.`;
        },
        unexpectedEndOfFile(text) {
            return `Unexpected end of file after "${text}" <--`;
        },
        expressionMissingEnd(expr, ch, line, pos) {
            return `The explicit expression "${expr}" is missing a closing "${ch}" character at line ${line} pos ${pos}.`;
        },
        jsCodeBlockkMissingClosingChar(line, codeFirstLine) {
            return `The code block is missing a closing "}" character. Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line ${line + 1} with text: "${codeFirstLine}"`;
        },
        invalidHtmlChar(ch, lineNum, posNum, afterText, expected) {
            return `"${ch}" is not a valid HTML character at line ${lineNum} pos ${posNum}` + (afterText ? ` after "${afterText}" < --` : expected ? ` (expected char = "${expected}")` : '.');
        },
        missingMatchingStartTag(tag, line, pos, html, ) {
            return `'${tag}' tag at line ${line + 1} pos ${pos + 1} is missing mathing start tag: '${html}' <--`;
        },
        missingMatchingEndTag(tag, line, pos, html) {
            return `'${tag}' tag at line ${line + 1} pos ${pos + 1} is missing mathing end tag: '${html}' <--`;
        },
        invalidExpressionChar(ch, line, pos, afterText) {
            return `Invalid "${ch}" symbol in expression at ${line} pos ${pos} after "${afterText}" <--`;
        },
        invalidHtmlTag(tag) {
            return `Invalid HTML-tag: '${tag}'`;
        },
        forbiddenViewName(viewName) {
            return `The file "${viewName}" is not available.`;
        },
        whitespaceExpectedAfter(keyword, line, pos) {
            return `A whitespace expected after the "${keyword}" keyword at line${line} pos ${pos}.`;
        },
        tagNameExpected(line, pos, html) {
            return `Tag name expected at line ${line + 1} pos ${pos + 1}: '${html}' <--`;
        },
        sectionNameExpectedAfter(keyword, line, pos) {
            return `A section name expected after the "${keyword}" keyword at line${line} pos ${pos}.`;
        },
        sectionNameCannotStartWith(ch, line, pos) {
            return `A section name cannot start with '${ch}' at line${line} pos ${pos}.`;
        },
        sectionNameCannotInclude(ch, line, pos) {
            return `A section name cannot include '${ch}' at line${line} pos ${pos}.`;
        },
        unexpectedLiteralFollowingTheSection(ch, line, pos) {
            return `Unexpected literal '${ch}' following the 'section' directive at line${line} pos ${pos}. Expected '{'.`;
        },
        sectionIsAlreadyDefined(sectionName, line, pos) {
            return `Section 'sectionName' is already defined.`;
        },
        sectionBlockIsMissingClosingBrace(sectionName) {
            return `The section block 'sectionName' is missing a closing "}" character.`;
        },
        sectionsCannotBeNested(line, pos, text) {
            return `Section blocks cannot be nested at line ${line} pos ${pos} after "${text}" <--`;
        }
    }
};

module.exports = errors;