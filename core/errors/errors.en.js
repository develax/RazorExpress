const ParserError = require('./ParserError');


class ParserErrorProcessor {
    constructor(set) {
        set = set || {};
        this.jshtml = set.jshtml;
    }

    endOfFileFoundAfterAtSign(lineNum, posNum) {
        var message = `End-of-file was found after the "@" character at line ${lineNum + 1} pos ${posNum + 1}. "@" must be followed by a valid code block. If you want to output an "@", escape it using the sequence: "@@"`;
        return new ParserError(message, this.jshtml, lineNum, posNum);
    }

    unexpectedCharacter(ch, lineNum, posNum, line) {
        var message = `unexpected '${ch}' character at line ${lineNum + 1} pos ${posNum + 1} after '${line}' <--`;
        return new ParserError(message, this.jshtml, lineNum, posNum);
    }

    unexpectedAtCharacter(lineNum, posNum) {
        var message = `unexpected '@' character at line ${lineNum + 1} pos ${posNum + 1}. Once inside the body of a code block (@if {}, @{}, etc.) or a section (@section{}) you do not need to use "@{" to switch to code.`;
        return new ParserError(message, this.jshtml, lineNum, posNum);
    }

    notValidStartOfCodeBlock(ch, lineNum, posNum) {
        var message = `"${ch}" is not valid at the start of a code block at line ${lineNum + 1} pos ${posNum + 1}. Only identifiers, keywords, "(" and "{" are valid.`;
        return new ParserError(message, this.jshtml, lineNum, posNum);
    }

    unexpectedEndOfFile(text) {
        var message = `Unexpected end of file after "${text}" <--`;
        return new ParserError(message, this.jshtml);
    }

    characterExpected(ch, line, pos) {
        var message = `'${ch}' character is expected at line ${line + 1} pos ${pos + 1}.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    expressionMissingEnd(expr, ch, line, pos) {
        var message = `The explicit expression "${expr}" is missing a closing character "${ch}" at line ${line + 1} pos ${pos + 1}.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    jsCodeBlockMissingClosingChar(line, codeFirstLine) {
        var message = `The code or section block is missing a closing "}" character. Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line ${line + 1} with text: "${codeFirstLine}"`;
        return new ParserError(message, this.jshtml, line);
    }

    invalidHtmlChar(ch, lineNum, posNum, afterText, expected) {
        var message = `"${ch}" is not a valid HTML character at line ${lineNum} pos ${posNum}` + (afterText ? ` after "${afterText}" < --` : expected ? ` (expected char = "${expected}")` : '.');
        return new ParserError(message, this.jshtml, lineNum, posNum);
    }

    missingMatchingStartTag(tag, line, pos, html) {
        var message = `'${tag}' tag at line ${line + 1} pos ${pos + 1} is missing mathing start tag: '${html}' <--`;
        return new ParserError(message, this.jshtml, line, pos, tag.length);
    }

    missingMatchingEndTag(tag, line, pos, html) {
        var message = `'${tag}' tag at line ${line + 1} pos ${pos + 1} is missing mathing end tag: '${html}' <--`;
        return new ParserError(message, this.jshtml, line, pos, tag.length);
    }

    invalidExpressionChar(ch, line, pos, afterText) {
        var message = `Invalid "${ch}" symbol in expression at line ${line + 1} pos ${pos + 1} after "${afterText}" <--`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    invalidHtmlTag(tag) {
        var message = `Invalid HTML-tag: '${tag}'`;
        return new ParserError(message, this.jshtml);
    }

    forbiddenViewName(viewName) {
        var message = `The file "${viewName}" is not available.`;
        return new ParserError(message, this.jshtml);
    }

    whiteSpaceExpectedAfter(keyword, line, pos) {
        var message = `A whitespace expected after the "${keyword}" keyword at line ${line + 1} pos ${pos + 1}.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    tagNameExpected(line, pos, html) {
        var message = `Tag name expected at line ${line + 1} pos ${pos + 1}: '${html}' <--`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    sectionNameExpectedAfter(keyword, line, pos) {
        var message = `A section name expected after the "${keyword}" keyword at line ${line + 1} pos ${pos + 1}.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    sectionNameCannotStartWith(ch, line, pos) {
        var message = `A section name cannot start with '${ch}' at line ${line + 1} pos ${pos + 1}.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    sectionNameCannotInclude(ch, line, pos) {
        var message = `A section name cannot include '${ch}' character at line ${line + 1} pos ${pos + 1}.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    unexpectedLiteralFollowingTheSection(ch, line, pos) {
        var message = `Unexpected literal '${ch}' following the 'section' directive at line ${line + 1} pos ${pos + 1}. Expected '{'.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    sectionIsAlreadyDefined(sectionName, line, pos) {
        var message = `The section '${sectionName}' at line ${line + 1} pos ${pos + 1} has been already defined.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    sectionBlockIsMissingClosingBrace(sectionName) {
        var message = `The section block '${sectionName}' is missing a closing "}" character.`;
        return new ParserError(message, this.jshtml);
    }

    sectionsCannotBeNested(line, pos) {
        var message = `Section blocks cannot be nested at line ${line + 1} pos ${pos + 1}.`;
        return new ParserError(message, this.jshtml, line, pos);
    }

    sectionIsNotFound(sectionName, filePath) {
        var message = `The view '${filePath}' requires the section '${sectionName}' which cannot be found.`;
        return new ParserError(message, this.jshtml);
    }

    sectionBeenRendered(sectionName, renderedBy, attemptedBy) {
        var message = `The section '${sectionName}' has already been rendered by '${renderedBy}'. There is an atempt to rendered it again by '${attemptedBy}'.`;
        return new ParserError(message, this.jshtml);
    }
}

ParserErrorProcessor.jshtmlShouldBeString = '[jshtml] argument should be a string';

module.exports = ParserErrorProcessor;