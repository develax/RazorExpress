const RazorError = require('./RazorError');

class ParserErrorFactory {
    constructor(templateInfo, linesBaseNumber) {
        this.startLineNum = linesBaseNumber;
        this.info = templateInfo;
        this.info.startLine = linesBaseNumber;
    }

    endOfFileFoundAfterAtSign(lineNum, posNum) {
        var message = `End-of-file was found after the "@" character at line ${lineNum + this.startLineNum} pos ${posNum + 1}. "@" must be followed by a valid code block. If you want to output an "@", escape it using the sequence: "@@"`;
        return RazorError.new({ message, info: this.info, line: lineNum, pos: posNum, capture: this.endOfFileFoundAfterAtSign });
    }

    unexpectedCharacter(ch, lineNum, posNum, line) {
        var message = `Unexpected '${ch}' character at line ${lineNum + this.startLineNum} pos ${posNum + 1} after '${line}'`;
        return RazorError.new({ message, info: this.info, line: lineNum, pos: posNum, capture: this.unexpectedCharacter });
    }

    unexpectedAtCharacter(lineNum, posNum) {
        var message = `Unexpected '@' character at line ${lineNum + this.startLineNum} pos ${posNum + 1}. Once inside the body of a code block (@if {}, @{}, etc.) or a section (@section{}) you do not need to use "@" character to switch to code.`;
        return RazorError.new({ message, info: this.info, line: lineNum, pos: posNum, capture: this.unexpectedAtCharacter });
    }

    notValidStartOfCodeBlock(ch, lineNum, posNum) {
        var message = `"${ch}" is not valid at the start of a code block at line ${lineNum + this.startLineNum} pos ${posNum + 1}. Only identifiers, keywords, "(" and "{" are valid.`;
        return RazorError.new({ message, info: this.info, line: lineNum, pos: posNum, capture: this.notValidStartOfCodeBlock });
    }

    unexpectedEndOfFile(text) {
        var message = `Unexpected end of file after '${text}'.`;
        return RazorError.new({ message, info: this.info, capture: this.unexpectedEndOfFile });
    }

    characterExpected(ch, line, pos) {
        var message = `'${ch}' character is expected at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.characterExpected });
    }

    characterExpectedAfter(ch, line, pos, after) {
        var message = `'${ch}' character is expected after '${after}' at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.characterExpectedAfter });
    }

    expressionMissingEnd(expr, ch, line, pos) {
        var message = `The explicit expression "${expr}" is missing a closing character "${ch}" at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.expressionMissingEnd });
    }

    jsCodeBlockMissingClosingChar(line, codeFirstLine) {
        var message = `The code or section block is missing a closing "}" character. Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line ${line + this.startLineNum} with text: "${codeFirstLine}"`;
        return RazorError.new({ message, info: this.info, line, capture: this.jsCodeBlockMissingClosingChar });
    }

    wordExpected(word, line, pos, len) {
        var message = `'${word}' expected at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, len, capture: this.wordExpected });
    }

    missingMatchingStartTag(tag, line, pos) {
        var message = `'${tag}' tag at line ${line + this.startLineNum} pos ${pos + 1} is missing matching start tag.`;
        return RazorError.new({ message, info: this.info, line, pos, len: tag.length, capture: this.missingMatchingStartTag });
    }

    missingMatchingEndTag(tag, line, pos) {
        var message = `'${tag}' tag at line ${line + this.startLineNum} pos ${pos + 1} is missing matching end tag.`;
        return RazorError.new({ message, info: this.info, line, pos, len: tag.length, capture: this.missingMatchingEndTag });
    }

    invalidExpressionChar(ch, line, pos, afterText) {
        var message = `Invalid "${ch}" symbol in expression at line ${line + this.startLineNum} pos ${pos + 1}` + (afterText ? ` after "${afterText}".` : ".");
        return RazorError.new({ message, info: this.info, line, pos, capture: this.invalidExpressionChar });
    }

    invalidHtmlTag(tag, line, pos) {
        var message = `Invalid HTML-tag: '${tag}'`;
        return RazorError.new({ message, info: this.info, line, pos, len: tag && tag.length, capture: this.invalidHtmlTag });
    }

    // forbiddenViewName(viewName) {
    //     var message = `The file "${viewName}" is not available.`;
    //     return new RazorError(message, this.info);
    // }

    whiteSpaceExpectedAfter(keyword, line, pos) {
        var message = `A whitespace expected after the "${keyword}" keyword at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.whiteSpaceExpectedAfter }); // cannot be tested.
    }

    tagNameExpected(line, pos) {
        var message = `Tag name expected at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.tagNameExpected });
    }

    sectionNameExpectedAfter(keyword, line, pos) {
        var message = `A section name expected after the "${keyword}" keyword at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.sectionNameExpectedAfter });
    }

    sectionNameCannotStartWith(ch, line, pos) {
        var message = `A section name cannot start with '${ch}' at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.sectionNameCannotStartWith });
    }

    sectionNameCannotInclude(ch, line, pos) {
        var message = `A section name cannot include '${ch}' character at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.sectionNameCannotInclude });
    }

    unexpectedLiteralFollowingTheSection(ch, line, pos) {
        var message = `Unexpected literal '${ch}' following the 'section' directive at line ${line + this.startLineNum} pos ${pos + 1}. Expected '{'.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.unexpectedLiteralFollowingTheSection });
    }

    sectionIsAlreadyDefined(sectionName, line, pos, viewFilePath) {
        var message = `Section '${sectionName}' at line ${line + this.startLineNum} pos ${pos + 1} has been already defined in the file '${viewFilePath}'. You cannot assign the same name to different sections in the same file.`;
        return RazorError.new({ message, info: this.info, line, pos, len: sectionName.length, capture: this.sectionIsAlreadyDefined });
    }

    // sectionBlockIsMissingClosingBrace(sectionName) {
    //     var message = `The section block '${sectionName}' is missing a closing "}" character.`;
    //     return new RazorError(message, this.info);
    // }

    sectionsCannotBeNested(line, pos) {
        var message = `Section blocks cannot be nested at line ${line + this.startLineNum} pos ${pos + 1}.`;
        return RazorError.new({ message, info: this.info, line, pos, capture: this.sectionsCannotBeNested });
    }

    sectionIsNotFound(sectionName, filePath) {
        var message = `View '${filePath}' requires the section '${sectionName}' which cannot be found.`;
        return RazorError.new({ message, info: this.info, capture: this.sectionIsNotFound });
    }

    sectionIsNotCompiled(sectionName, filePath) {
        var message = `You try to render the section '${sectionName}' from the '${filePath}' view. This section has not been compiled yet. Make sure it is defined before the '@Html.section' method is called.`;
        return RazorError.new({ message, info: this.info, capture: this.sectionIsNotCompiled });
    }

    sectionsAlreadyRendered(sectionName, renderedBy, attemptedBy) {
        var message = `Sections named '${sectionName}' has already been rendered by '${renderedBy}'. There is an atempt to rendered it again by '${attemptedBy}'.`;
        return RazorError.new({ message, info: this.info, capture: this.sectionsAlreadyRendered });
    }

    sectionNeverRendered(sectionName, viewPath) {
        var message = `Section '${sectionName}' in '${viewPath}' has never been rendered. If a section exists it must be rendered.`;
        return RazorError.new({ message, info: this.info, capture: this.sectionNeverRendered });
    }

    partialViewNotFound(partialView, searchedLocations) {
        let viewTypeName = (this.isLayout) ? "layout" : "partial";
        let message = `The view "${this.info.filename}" cannot find the ${viewTypeName} view "${partialView}".\nThe following locations were searched:\n${searchedLocations.map(l => `"${l}"`).join("\n")}`;
        return RazorError.new({ message, info: this.info, capture: this.partialViewNotFound });
    }

    errorReadingFile(error) {
        let message = `Reading file '${this.info.filename}' caused an error: ${error}`;
        let parserError = RazorError.new({ message, info: this.info, capture: this.errorReadingFile });
        setInnerError(parserError, error);
        return parserError;
    }

    errorReadingView(filename, error) {
        let message = `Reading view file '${filename}' caused an error: ${error}`;
        let parserError = RazorError.new({ message, info: this.info, capture: this.errorReadingView });
        setInnerError(parserError, error);
        return parserError;
    }

    partialLayoutNameExpected() {
        let message = "Partial layout name is expected."
        return RazorError.new({ message, info: this.info, capture: this.partialLayoutNameExpected });
    }

    // invalidViewExtension(viewName, expectedExtension){
    //     let message = `The view '${viewName}' includes invalid extension. Expected extension '${expectedExtension}'`;
    //     return new ParserError(message, this.args);
    // }

    /**
     * 
     * Doesn't produce a `ParserError`, just extends the existant one in other prevent VM from adding additional lines to the `.Stack` when rethrowing.
     */
    extendError(exc) {
        RazorError.extend(exc, { info: this.info });
    }
}

ParserErrorFactory.templateShouldBeString = 'The [template] argument should be a string.';

function setInnerError(parserError, error) {
    if (error.message)
        parserError.inner = error;
}


module.exports = ParserErrorFactory;