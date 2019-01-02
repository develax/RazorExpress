(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = class HtmlString {
    constructor(html) {
        this.html = html;
    }

    toString() {
        return this.html;
    }
}
},{}],2:[function(require,module,exports){
// Version: 1.0.0

const parser = require('./parser')();

raz = {
    render: (template, model) => {
        return parser.compileSync(template, model);
    }
}
},{"./parser":7}],3:[function(require,module,exports){
const htmlEncode = require('../libs/js-htmlencode');

/////////////////////////////////////////////////////////////////////////
// https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216
// https://rclayton.silvrback.com/custom-errors-in-node-js
/////////////////////////////////////////////////////////////////////////

// const regex = /.*Error:/;

class RazorError extends Error {
    constructor(message, captureFrame) {
        super(message);

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, captureFrame || this.constructor);
    }

    static new(args) {
        let exc = new RazorError(args.message, args.capture || this.new);
        this.extend(exc, args);
        return exc;
    }

    static extend(exc, args) {
        exc.isRazorError = true;

        if (exc.data) {
            var oldData = exc.data;
        }

        exc.data = Object.assign({ line: args.line, pos: args.pos, len: args.len }, args.info);

        if (exc.__dbg && exc.__dbg.pos)
            exc.data = Object.assign({ posRange: { start: exc.__dbg.pos.start, end: exc.__dbg.pos.end } }, exc.data);

        if (oldData)
            exc.data.inner = oldData;

        if (!exc.html)
            exc.html = RazorError.prototype.html;
    }

    html() {
        let codeHtml = '', mainInfo = { title: '' };
        let stackHtml = stackToHtml(this, this.data, mainInfo);

        for (var data = this.data; data; data = data.inner) {
            if (Utils.isServer)
                codeHtml += "<div class='arrow'>&#8681;</div>"

            codeHtml += dataToHtml(data, mainInfo);
            codeHtml += '<hr />'
        }

        var html = `
        <!DOCTYPE html>
        <html>
        <head>
        <style type="text/css" scoped>
            h1, h2, h3{
                font-weight: normal;
            }
            div.filepath {
                font-weight: bold;
                font-size: 1.05rem;
            }
            body { 
                font-size: .813em;
                font-family: Consolas, "Courier New", courier, monospace;
            }
            .stack{
                color: orange;
                white-space: pre;
            }
            .stack .error{
                color: #e20000;
                white-space: pre-wrap;
                font-weight: bold;
            }
            ol {
                color: darkgray;
            }
            ol li {
                background-color: #fbfbfb;
                white-space: pre;
            }
            ol li.highlight{
                color: red;// darkslategray;
                background-color: #f8f9b3; 
            }
            ol li span {
                color: #196684;//darkslategray;
            }
            ol li.highlight span {
                color: black;
            }
            ol li span.highlight {
                border: solid 1px red;
            }
            ol li span.multilight {
                background-color: #ebef00;
                font-weight: bold;
                color: red;
            }
            ol li.comment {
                color: lightgray;
            }
            ol li.comment span {
                color: darkgray;
            }
            .arrow{
                font-size: 1.5rem;
                color: orange;
                margin-left: 1rem;
            }
            hr {
                opacity: 0.5;
            }
        </style>
        </head>
        <body>
            <h1>A template compilation error occured</h1>
            <div class="stack">${stackHtml}</div>
            <hr />
            ${codeHtml}
        </body>
        </html>
        `;
        return html;
    }
}

module.exports = RazorError;

function stackToHtml(exc, data, mainInfo) {
    let lines = exc.stack.split('\n');
    let fireFox = (typeof navigator !== 'undefined') && navigator.userAgent.toLowerCase().indexOf('firefox') !== -1; // for compatibility with FireFox

    if (fireFox) {
        let message = `${exc.name}: ${exc.message}`; 
        lines.unshift(message);
    }

    let html = '<div>';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (fireFox){
            let parts = line.split('@');
            
            if (parts.length === 2){
                if (!parts[0]) // empty
                    parts[0] = "<anonymous>";

                line = `at  ${parts[0]} (${parts[1]})`;
            }
        }
        else if (i === 0 && (line.startsWith("evalmachine.") || line.startsWith("undefined:"))) {
            let nextLineExists = i < lines.length + 1;

            if (nextLineExists && data.jshtml && data.posRange) { // This is likely HTML parsing error (not code runtime error).
                // Let's try to narrow the error area by the data from the stack.
                let codeLine = lines[i + 1].trimRight();
                let errorCodeFragment = data.jshtml.substring(data.posRange.start, data.posRange.end);
                let codePos = errorCodeFragment.indexOf(codeLine);
                // Check if it exists and only once in the `errorCodeFragment`.
                if (codePos !== -1 && codePos === errorCodeFragment.lastIndexOf(codeLine)) {
                    // Set a more precise location of the error.
                    data.posRange.start = data.posRange.start + codePos;
                    data.posRange.end = data.posRange.start + codeLine.length;

                    // Include '@' symbol.
                    if (data.posRange.start > 0 && data.jshtml[data.posRange.start - 1] === '@')
                        data.posRange.start -= 1;
                }
            }

            continue; // skip the very first line like "evalmachine.<anonymous>:22"
        }

        let encodedLine = htmlEncode(line);
        let trim = line.trim();
        let style = '';

        if (trim && trim !== '^' && !trim.startsWith("at ")) {
            if (trim.startsWith('RazorError') || mainInfo.title)
                style = 'id="error" class="error"'; // the second line is the error description
            else
                style = 'class="error"';

            if (mainInfo.title)
                mainInfo.title += '\r\n';

            mainInfo.title += encodedLine;
        }

        html += `<span ${style}>${encodedLine}</span><br/>`;
    }

    html += '</div>';
    return html;
}

function dataToHtml(data, mainInfo) {
    let html;

    if (data.jshtml) {
        let textCursor = 0;
        lines = data.jshtml.split('\n');
        let startLine = data.startLine ? data.startLine : 0; 
        html = `<ol start='${startLine}'>`;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let highlight, htmlLine, comment, multilight;
            let textCursorEnd = textCursor + line.length + 1; // + '\n'

            if (data.posRange && data.posRange.start < data.posRange.end) {
                if (data.posRange.start >= textCursor && data.posRange.start < textCursorEnd) {
                    var pos = data.posRange.start - textCursor;

                    if (data.posRange.end < textCursorEnd) {
                        var len = data.posRange.end - data.posRange.start;
                        data.posRange = null; // prevent further useless computation during the next iterations of this cycle
                    }
                    else {
                        len = line.length;
                        data.posRange.start = textCursorEnd; // move to the beginning of the next line
                    }

                    multilight = "multilight";
                }
            }
            else if (data.line === i) {
                pos = data.pos;
                len = data.len || 1;
            }

            if (pos != null && typeof pos !== 'undefined') {
                if (pos < line.length) {
                    let start = htmlEncode(line.substring(0, pos));
                    let one = htmlEncode(line.substring(pos, pos + len));
                    let end = htmlEncode(line.substring(pos + len));
                    htmlLine = `<span>${start}</span><span class='${multilight || "highlight"} source-error' title='${mainInfo.title}'>${one}</span><span>${end}</span>`;
                    highlight = "class='highlight'";

                }
                pos = null;
            }
            else {
                let trim = line.trim();

                if (trim.length > 6 && trim.startsWith("<!--") && trim.endsWith("-->"))
                    comment = "class='comment'";
                //htmlLine = `<span class="comment">${htmlEncode(trim)}</span>`;
            }

            html += `<li ${comment || highlight}><span>`;
            html += htmlLine ? htmlLine : htmlEncode(line);
            html += "</span></li>";

            textCursor = textCursorEnd;
        }// for

        //let fileFolder = path.dirname(data.filename);
        let fileName = `<div class="filepath">${Utils.isServer ? Utils.path.basename(data.filename) : "Template:"}</div>`;

        html += "</ol>";
        html = `
<div class="code">
    ${fileName}
    ${html}
</div>
`;
    }// if (this.data.jshtml)

    return html;
}

// /**
//  * HELPERS
//  */
// function getIndentifier(codeLine, startPos){
//     let ch = codeLine[startPos];
//     let isIdn = Char.isLetter(ch) || '_$'.includes(ch); // is it identifier
//     let result = ch;

//     for(let i = startPos + 1, ch = codeLine[i]; i < codeLine.length && (isIdn ? Char.isIdentifier(ch) : !Char.isIdentifier(ch)); i++, ch = codeLine[i])
//         result += ch;

//     return result;
// }
},{"../libs/js-htmlencode":6}],4:[function(require,module,exports){
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
        var message = `Sections named '${sectionName}' have already been rendered by '${renderedBy}'. There is an atempt to rendered it again by '${attemptedBy}'.`;
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
},{"./RazorError":3}],5:[function(require,module,exports){
module.exports = require("./errors.en");
},{"./errors.en":4}],6:[function(require,module,exports){
(function (global){
/**
 * [js-htmlencode]{@link https://github.com/emn178/js-htmlencode}
 *
 * @version 0.3.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
    'use strict';
  
    const isBrowser = typeof window !== 'undefined';
    var root = isBrowser ? window : global;
    var AMD = typeof define === 'function' && define.amd;
  
    var HTML_ENTITIES = {
      '&nbsp;' : '\u00A0',
      '&iexcl;' : '\u00A1',
      '&cent;' : '\u00A2',
      '&pound;' : '\u00A3',
      '&curren;' : '\u00A4',
      '&yen;' : '\u00A5',
      '&brvbar;' : '\u00A6',
      '&sect;' : '\u00A7',
      '&uml;' : '\u00A8',
      '&copy;' : '\u00A9',
      '&ordf;' : '\u00AA',
      '&laquo;' : '\u00AB',
      '&not;' : '\u00AC',
      '&shy;' : '\u00AD',
      '&reg;' : '\u00AE',
      '&macr;' : '\u00AF',
      '&deg;' : '\u00B0',
      '&plusmn;' : '\u00B1',
      '&sup2;' : '\u00B2',
      '&sup3;' : '\u00B3',
      '&acute;' : '\u00B4',
      '&micro;' : '\u00B5',
      '&para;' : '\u00B6',
      '&middot;' : '\u00B7',
      '&cedil;' : '\u00B8',
      '&sup1;' : '\u00B9',
      '&ordm;' : '\u00BA',
      '&raquo;' : '\u00BB',
      '&frac14;' : '\u00BC',
      '&frac12;' : '\u00BD',
      '&frac34;' : '\u00BE',
      '&iquest;' : '\u00BF',
      '&Agrave;' : '\u00C0',
      '&Aacute;' : '\u00C1',
      '&Acirc;' : '\u00C2',
      '&Atilde;' : '\u00C3',
      '&Auml;' : '\u00C4',
      '&Aring;' : '\u00C5',
      '&AElig;' : '\u00C6',
      '&Ccedil;' : '\u00C7',
      '&Egrave;' : '\u00C8',
      '&Eacute;' : '\u00C9',
      '&Ecirc;' : '\u00CA',
      '&Euml;' : '\u00CB',
      '&Igrave;' : '\u00CC',
      '&Iacute;' : '\u00CD',
      '&Icirc;' : '\u00CE',
      '&Iuml;' : '\u00CF',
      '&ETH;' : '\u00D0',
      '&Ntilde;' : '\u00D1',
      '&Ograve;' : '\u00D2',
      '&Oacute;' : '\u00D3',
      '&Ocirc;' : '\u00D4',
      '&Otilde;' : '\u00D5',
      '&Ouml;' : '\u00D6',
      '&times;' : '\u00D7',
      '&Oslash;' : '\u00D8',
      '&Ugrave;' : '\u00D9',
      '&Uacute;' : '\u00DA',
      '&Ucirc;' : '\u00DB',
      '&Uuml;' : '\u00DC',
      '&Yacute;' : '\u00DD',
      '&THORN;' : '\u00DE',
      '&szlig;' : '\u00DF',
      '&agrave;' : '\u00E0',
      '&aacute;' : '\u00E1',
      '&acirc;' : '\u00E2',
      '&atilde;' : '\u00E3',
      '&auml;' : '\u00E4',
      '&aring;' : '\u00E5',
      '&aelig;' : '\u00E6',
      '&ccedil;' : '\u00E7',
      '&egrave;' : '\u00E8',
      '&eacute;' : '\u00E9',
      '&ecirc;' : '\u00EA',
      '&euml;' : '\u00EB',
      '&igrave;' : '\u00EC',
      '&iacute;' : '\u00ED',
      '&icirc;' : '\u00EE',
      '&iuml;' : '\u00EF',
      '&eth;' : '\u00F0',
      '&ntilde;' : '\u00F1',
      '&ograve;' : '\u00F2',
      '&oacute;' : '\u00F3',
      '&ocirc;' : '\u00F4',
      '&otilde;' : '\u00F5',
      '&ouml;' : '\u00F6',
      '&divide;' : '\u00F7',
      '&oslash;' : '\u00F8',
      '&ugrave;' : '\u00F9',
      '&uacute;' : '\u00FA',
      '&ucirc;' : '\u00FB',
      '&uuml;' : '\u00FC',
      '&yacute;' : '\u00FD',
      '&thorn;' : '\u00FE',
      '&yuml;' : '\u00FF',
      '&quot;' : '\u0022',
      '&amp;' : '\u0026',
      '&lt;' : '\u003C',
      '&gt;' : '\u003E',
      '&apos;' : '\u0027',
      '&OElig;' : '\u0152',
      '&oelig;' : '\u0153',
      '&Scaron;' : '\u0160',
      '&scaron;' : '\u0161',
      '&Yuml;' : '\u0178',
      '&circ;' : '\u02C6',
      '&tilde;' : '\u02DC',
      '&ensp;' : '\u2002',
      '&emsp;' : '\u2003',
      '&thinsp;' : '\u2009',
      '&zwnj;' : '\u200C',
      '&zwj;' : '\u200D',
      '&lrm;' : '\u200E',
      '&rlm;' : '\u200F',
      '&ndash;' : '\u2013',
      '&mdash;' : '\u2014',
      '&lsquo;' : '\u2018',
      '&rsquo;' : '\u2019',
      '&sbquo;' : '\u201A',
      '&ldquo;' : '\u201C',
      '&rdquo;' : '\u201D',
      '&bdquo;' : '\u201E',
      '&dagger;' : '\u2020',
      '&Dagger;' : '\u2021',
      '&permil;' : '\u2030',
      '&lsaquo;' : '\u2039',
      '&rsaquo;' : '\u203A',
      '&euro;' : '\u20AC',
      '&fnof;' : '\u0192',
      '&Alpha;' : '\u0391',
      '&Beta;' : '\u0392',
      '&Gamma;' : '\u0393',
      '&Delta;' : '\u0394',
      '&Epsilon;' : '\u0395',
      '&Zeta;' : '\u0396',
      '&Eta;' : '\u0397',
      '&Theta;' : '\u0398',
      '&Iota;' : '\u0399',
      '&Kappa;' : '\u039A',
      '&Lambda;' : '\u039B',
      '&Mu;' : '\u039C',
      '&Nu;' : '\u039D',
      '&Xi;' : '\u039E',
      '&Omicron;' : '\u039F',
      '&Pi;' : '\u03A0',
      '&Rho;' : '\u03A1',
      '&Sigma;' : '\u03A3',
      '&Tau;' : '\u03A4',
      '&Upsilon;' : '\u03A5',
      '&Phi;' : '\u03A6',
      '&Chi;' : '\u03A7',
      '&Psi;' : '\u03A8',
      '&Omega;' : '\u03A9',
      '&alpha;' : '\u03B1',
      '&beta;' : '\u03B2',
      '&gamma;' : '\u03B3',
      '&delta;' : '\u03B4',
      '&epsilon;' : '\u03B5',
      '&zeta;' : '\u03B6',
      '&eta;' : '\u03B7',
      '&theta;' : '\u03B8',
      '&iota;' : '\u03B9',
      '&kappa;' : '\u03BA',
      '&lambda;' : '\u03BB',
      '&mu;' : '\u03BC',
      '&nu;' : '\u03BD',
      '&xi;' : '\u03BE',
      '&omicron;' : '\u03BF',
      '&pi;' : '\u03C0',
      '&rho;' : '\u03C1',
      '&sigmaf;' : '\u03C2',
      '&sigma;' : '\u03C3',
      '&tau;' : '\u03C4',
      '&upsilon;' : '\u03C5',
      '&phi;' : '\u03C6',
      '&chi;' : '\u03C7',
      '&psi;' : '\u03C8',
      '&omega;' : '\u03C9',
      '&thetasym;' : '\u03D1',
      '&upsih;' : '\u03D2',
      '&piv;' : '\u03D6',
      '&bull;' : '\u2022',
      '&hellip;' : '\u2026',
      '&prime;' : '\u2032',
      '&Prime;' : '\u2033',
      '&oline;' : '\u203E',
      '&frasl;' : '\u2044',
      '&weierp;' : '\u2118',
      '&image;' : '\u2111',
      '&real;' : '\u211C',
      '&trade;' : '\u2122',
      '&alefsym;' : '\u2135',
      '&larr;' : '\u2190',
      '&uarr;' : '\u2191',
      '&rarr;' : '\u2192',
      '&darr;' : '\u2193',
      '&harr;' : '\u2194',
      '&crarr;' : '\u21B5',
      '&lArr;' : '\u21D0',
      '&uArr;' : '\u21D1',
      '&rArr;' : '\u21D2',
      '&dArr;' : '\u21D3',
      '&hArr;' : '\u21D4',
      '&forall;' : '\u2200',
      '&part;' : '\u2202',
      '&exist;' : '\u2203',
      '&empty;' : '\u2205',
      '&nabla;' : '\u2207',
      '&isin;' : '\u2208',
      '&notin;' : '\u2209',
      '&ni;' : '\u220B',
      '&prod;' : '\u220F',
      '&sum;' : '\u2211',
      '&minus;' : '\u2212',
      '&lowast;' : '\u2217',
      '&radic;' : '\u221A',
      '&prop;' : '\u221D',
      '&infin;' : '\u221E',
      '&ang;' : '\u2220',
      '&and;' : '\u2227',
      '&or;' : '\u2228',
      '&cap;' : '\u2229',
      '&cup;' : '\u222A',
      '&int;' : '\u222B',
      '&there4;' : '\u2234',
      '&sim;' : '\u223C',
      '&cong;' : '\u2245',
      '&asymp;' : '\u2248',
      '&ne;' : '\u2260',
      '&equiv;' : '\u2261',
      '&le;' : '\u2264',
      '&ge;' : '\u2265',
      '&sub;' : '\u2282',
      '&sup;' : '\u2283',
      '&nsub;' : '\u2284',
      '&sube;' : '\u2286',
      '&supe;' : '\u2287',
      '&oplus;' : '\u2295',
      '&otimes;' : '\u2297',
      '&perp;' : '\u22A5',
      '&sdot;' : '\u22C5',
      '&lceil;' : '\u2308',
      '&rceil;' : '\u2309',
      '&lfloor;' : '\u230A',
      '&rfloor;' : '\u230B',
      '&lang;' : '\u2329',
      '&rang;' : '\u232A',
      '&loz;' : '\u25CA',
      '&spades;' : '\u2660',
      '&clubs;' : '\u2663',
      '&hearts;' : '\u2665',
      '&diams;' : '\u2666'
    };
  
    var decodeEntity = function (code) {
      // name type
      if (code.charAt(1) !== '#') {
        return HTML_ENTITIES[code] || code;
      }
  
      var n, c = code.charAt(2);
      // hex number
      if (c === 'x' || c === 'X') {
        c = code.substring(3, code.length - 1);
        n = parseInt(c, 16);
      } else {
        c = code.substring(2, code.length - 1);
        n = parseInt(c);
      }
      return isNaN(n) ? code : String.fromCharCode(n);
    };
  
    var htmlEncode = function (str) {
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
  
    var htmlDecode = function (str) {
      return str.replace(/&#?\w+;/g, decodeEntity);
    };
  
    module.exports = htmlEncode;
    htmlEncode.htmlEncode = htmlEncode;
    htmlEncode.htmlDecode = htmlDecode;
  })();
  
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],7:[function(require,module,exports){
'use strict';
require('./utils');

function compilePageSync(Html, Model, ViewData, debug) {
    'use strict';

    if (debug) {
        let sandbox = Html._sandbox;
        let vm = Html._vm;
        sandbox.Html = Html;
        sandbox.Model = Model;
        sandbox.ViewData = ViewData;
        vm.runInNewContext(Html._js, sandbox);
    }
    else {
        eval(Html._js);
    }

    return;
}

function compilePage(Html, Model, ViewData, debug, done) {
    try {
        compilePageSync(Html, Model, ViewData, debug);
        return Html.__renderLayout(done);
    }
    catch (exc) {
        done(exc);
    }
}

module.exports = function (opts) {
    opts = opts || {};
    const debugMode = opts.debug;
    const log = opts.log || { debug: () => { } };
    log.debug(`Parse debug mode is '${!!debugMode}'.`);

    const HtmlString = require('./HtmlString');
    const htmlEncode = require('./libs/js-htmlencode');
    const vm = opts.vm;

    ////////////////////
    ///   Html class
    ////////////////////
    function Html(args) {
        // Non-user section.
        this._vm = vm;

        if (debugMode) {
            this._sandbox = Object.create(null);
            vm.createContext(this._sandbox);
        }

        // function (process,...){...}() prevents [this] to exist for the 'vm.runInNewContext()' method
        this._js = `
(function (process, window, global, module, compilePage, compilePageSync, undefined) { 
    'use strict';
    delete Html._js;
    delete Html._vm;
    delete Html._sandbox;
    ${args.js}
}).call();`;

        // User section.
        if (debugMode)
            this.__dbg = { viewName: args.filePath, template: args.template, pos: [] }

        this.$ =
            this.layout = null;
        // Private
        let sectionName = null;
        let sections = args.parsedSections;

        this.__val = function (i) {
            return args.jsValues.getAt(i);
        };

        this.__renderLayout = (done) => {
            if (!this.layout) // if the layout is not defined..
                return Promise.resolve().then(() => done(null, args.html)), null;

            // looking for the `Layout`..
            args.er.isLayout = true; // the crutch
            args.findPartial(this.layout, args.filePath, args.er, (err, result) => {
                args.er.isLayout = false;
                if (err) return done(err);
                let compileOpt = {
                    template: result.data,
                    filePath: result.filePath,
                    model: args.model,
                    bodyHtml: args.html,
                    findPartial: args.findPartial,
                    findPartialSync: args.findPartialSync,
                    parsedSections: args.parsedSections,
                    partialsCache: args.partialsCache,
                    viewData: args.viewData
                };
                compile(compileOpt, done);
            });
        };

        this.__sec = function (name) { // in section
            if (!sectionName) {
                sectionName = name;
            }
            else if (sectionName === name) {
                sections[sectionName][args.filePath].compiled = true;
                sectionName = null;
            }
            else {
                throw new Error(`Unexpected section name = '${name}'.`); // Cannot be tested via user-inputs.
            }
        };

        this.raw = function (val) { // render
            if (typeof val === 'undefined' || val === '') // 'undefined' can be passed when `Html.raw()` is used by user in the view, in this case it will be wrapped into `Html.ecnode()` anyway an it will call `Html.raw` passing 'undefined' to it.
                return;

            if (sectionName) {
                let sec = sections[sectionName][args.filePath];
                if (!sec.compiled) // it could have been compiled already if it's defined in a partial view which is rendred more than once
                    sec.html += val;
            }
            else {
                args.html += val;
            }
        };

        this.encode = function (val) {
            var encoded = this.getEncoded(val);
            this.raw(encoded);
        };

        this.getEncoded = function (val) {
            if (!val || typeof val === "number" || val instanceof Number || val instanceof HtmlString)
                return val;

            if (String.is(val))
                return htmlEncode(val);

            return htmlEncode(val.toString());
        };

        this.body = function () {
            return new HtmlString(args.bodyHtml);
        };

        this.section = function (name, required) {
            if (!args.filePath)
                throw new Error("'args.filePath' is not set.");

            let secGroup = sections[name];

            if (secGroup) {
                if (secGroup.renderedBy)
                    throw args.er.sectionsAlreadyRendered(name, secGroup.renderedBy, args.filePath); // TESTME:

                let html = '';

                for (var key in secGroup) {
                    if (secGroup.hasOwnProperty(key)) {
                        let sec = secGroup[key];

                        if (!sec.compiled)
                            throw args.er.sectionIsNotCompiled(name, args.filePath); // [#3.2]

                        html += sec.html;
                    }
                }

                secGroup.renderedBy = args.filePath;
                return new HtmlString(html);
            }
            else {
                if (required)
                    throw args.er.sectionIsNotFound(name, args.filePath); // [#3.3] 
            }

            return '';
        };

        this.getPartial = function (viewName, viewModel) {
            let compileOpt = {
                model: viewModel || args.model, // if is not set explicitly, set default (parent) model
                findPartial: args.findPartial,
                findPartialSync: args.findPartialSync,
                sections,
                parsedSections: args.parsedSections,
                partialsCache: args.partialsCache,
                viewData: args.viewData
            };

            // Read file and complie to JS.
            let partial = args.findPartialSync(viewName, args.filePath, args.er, args.partialsCache);
            compileOpt.template = partial.data;
            compileOpt.filePath = partial.filePath;

            if (partial.js) { // if it's taken from cache
                compileOpt.js = partial.js;
                compileOpt.jsValues = partial.jsValues;
            }

            let { html, precompiled } = compileSync(compileOpt);
            partial.js = precompiled.js; // put to cache
            partial.jsValues = precompiled.jsValues; // put to cache

            return html;
        };

        this.partial = function (viewName, viewModel) {
            var partialHtml = this.getPartial(viewName, viewModel);
            this.raw(partialHtml)
        };
    }

    class Block {
        constructor(type, name) {
            this.type = type;
            if (name)
                this.name = name;
            this.text = '';
        }

        append(ch) {
            this.text += ch;
            //this.text += (ch === '"') ? '\\"' : ch;
        }

        toScript(jsValues) {
            return toScript(this, jsValues);
        }
    }

    function toScript(block, jsValues) {
        if (block.type === blockType.section) {
            let secMarker = `\r\nHtml.__sec("${block.name}");`;
            let script = secMarker;

            for (let n = 0; n < block.blocks.length; n++) {
                let sectionBlock = block.blocks[n];
                script += toScript(sectionBlock, jsValues);
            }

            script += secMarker;
            return script;
        }
        else {
            let i;

            switch (block.type) {
                case blockType.html:
                    i = jsValues.enq(block.text);
                    return "\r\nHtml.raw(Html.__val(" + i + "));";
                case blockType.expr:
                    i = jsValues.enq(block.text);
                    let code = `Html.encode(eval(Html.__val(${i})));`;
                    return debugMode ? setDbg(code, block) : "\r\n" + code;
                case blockType.code:
                    return debugMode ? setDbg(block.text, block) : "\r\n" + block.text;
                default:
                    throw new Error(`Unexpected block type = "${blockType}".`);
            }
        }

        throw new Error(`Unexpected code behaviour, block type = "${blockType}".`);
    }

    function setDbg(code, block) {
        return `
Html.__dbg.pos = { start:${block.posStart}, end: ${block.posEnd} };
${code}
Html.__dbg.pos = null;`;
    }

    class Queue {
        constructor() {
            this._items = [];
        }

        enq(item) {
            //if (opts.debug) log.debug(item);
            return this._items.push(item) - 1;
        }

        getAt(i) {
            if (opts.debug) {
                let item = this._items[i];
                //log.debug(item);
                return item;
            }
            else {
                return this._items[i];
            }
        }
    }

    const _sectionKeyword = "section";
    //const _functionKeyword = "function";
    const blockType = { none: 0, html: 1, code: 2, expr: 3, section: 4 };

    const RazorError = require('./errors/RazorError');
    const ErrorsFactory = require('./errors/errors');
    const voidTags = "area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr".toUpperCase().split("|").map(s => s.trim());

    ////////////////
    //   PARSER   //
    ////////////////
    class Parser {
        constructor(args) {
            args.filePath = args.filePath || "js-script";
            let linesBaseNumber = (debugMode && opts.express) ? 0 : 1; // in debug-mode the file-path of a template is added as a very first line comment
            this.args = args;
            this.er = new ErrorsFactory({ filename: args.filePath, jshtml: args.template }, linesBaseNumber);
        }

        compile(done) {
            log.debug();
            let errorFactory = this.er;

            try {
                var htmlObj = this.getHtml({}, done);
            }
            catch (exc) {
                return error(exc);
            }

            compilePage(htmlObj, this.args.model, this.args.viewData, debugMode, (err, html) => {
                if (err)
                    return error(err, htmlObj.__dbg);

                try {
                    this.checkSections();
                }
                catch (exc) {
                    return error(exc, htmlObj.__dbg);
                }

                return done(null, html);
            });

            function error(err, dbg) {
                err.__dbg = dbg;
                var parserError = toParserError(err, errorFactory);
                return Promise.resolve().then(() => done(parserError)), null;
            }
        }

        compileSync() {
            try {
                log.debug();
                var htmlArgs = {};
                var html = this.getHtml(htmlArgs);
                compilePageSync(html, this.args.model, this.args.viewData, debugMode);
                this.checkSections();
            }
            catch (exc) {
                exc.__dbg = html && html.__dbg;
                throw toParserError(exc, this.er);
            }

            return { html: htmlArgs.html, precompiled: { js: htmlArgs.js, jsValues: htmlArgs.jsValues } };
        }

        getHtml(htmlArgs) {
            log.debug(this.args.filePath);
            this.args.parsedSections = this.args.parsedSections || {};
            this.args.viewData = this.args.viewData || this.args.ViewData || {};
            this.args.partialsCache = this.args.partialsCache || {};
            let js = this.args.js;
            let jsValues = this.args.jsValues;
            let template = this.args.template;

            if (!js) {
                var isString = String.is(template);

                if (!isString)
                    throw new Error(ErrorsFactory.templateShouldBeString);

                this.text = template;
                this.line = '', this.lineNum = 0, this.pos = 0, this.padding = '';
                this.inSection = false;
                this.blocks = [];
                this.parseHtml(this.blocks);
                jsValues = new Queue();
                var scripts = this.blocks.map(b => b.toScript(jsValues));
                js = scripts.join("");
            }

            Object.assign(htmlArgs, {
                html: '',
                jsValues,
                js,
                template,
                er: this.er
            });

            Object.assign(htmlArgs, this.args);
            var html = new Html(htmlArgs);
            return html;
        }

        // Check if all sections have been rendered.
        checkSections() {
            if (!this.args.root)
                return;

            let sections = this.args.parsedSections;

            for (var key in sections) {
                if (sections.hasOwnProperty(key)) {
                    let secGroup = sections[key];

                    if (!secGroup.renderedBy) {
                        let sec = secGroup[Object.keys(secGroup)[0]]; // just any section from the group
                        throw this.er.sectionNeverRendered(key, sec.filePath);
                    }
                }
            }
        }

        parseHtml(blocks, outerWaitTag) {
            log.debug();
            const docTypeName = "!DOCTYPE";
            const textQuotes = `'"\``;
            var quotes = [];
            const tagKinds = { open: 0, close: 1, selfclose: 2 };
            var openTags = [];
            var tag = '', lineLastLiteral = '', lastLiteral = '';
            var block = this.newBlock(blockType.html, blocks);
            let stop = false, inComments = false;
            let inJs = "script".equal(outerWaitTag, true);
            var lastCh = '';

            for (var ch = this.pickChar(); ch; ch = this.pickChar()) {
                let isSpace = Char.isWhiteSpace(ch);
                let nextCh = this.pickNextChar();
                let inQuotes = (quotes.length > 0);

                if (inComments) {
                    if (ch === '-') {
                        if (!tag || tag === '-')
                            tag += ch;
                        else
                            tag = '';
                    }
                    else if (ch === '>') {
                        if (tag === '--')
                            inComments = false;

                        tag = '';
                    }
                    else {
                        tag = '';
                    }
                }
                else if (ch === '@') {
                    if (nextCh === '@') { // checking for '@@' that means just text '@'
                        ch = this.fetchChar(); // skip the next '@'
                        nextCh = this.pickNextChar();
                    }
                    else {
                        this.fetchChar();
                        this.parseCode(blocks);

                        if (tag === '<' || tag === '</')
                            tag = '';

                        block = this.newBlock(blockType.html, blocks);
                        continue;
                    }
                }
                else if (inQuotes) {
                    if (tag) tag += ch;
                    if (textQuotes.indexOf(ch) !== -1) { // it could be closing text qoutes
                        if (quotes.length && quotes[quotes.length - 1] === ch) {
                            quotes.pop(); // collasping quotes..
                            inQuotes = false;
                        }
                    }
                }
                else if ((tag || inJs) && textQuotes.indexOf(ch) !== -1) { // it could be opening text qoutes within a tag's attributes or a JS-block
                    quotes.push(ch);
                    inQuotes = true;
                    if (tag) tag += ch;
                }
                else if (ch === '-') {
                    if (tag.length > 1) { // at least '<!'
                        if (lastCh === '!') {
                            tag += ch;
                        }
                        else if (tag.startsWith("!-", 1)) {
                            tag = '';
                            inComments = true;
                        }
                    }
                    else {
                        tag = '';
                    }
                }
                else if (ch === '<') {
                    tag = ch; // if '<' occurs more than once, all the previous ones are considered as a plain text by default
                }
                else if (ch === '/') {
                    if (tag) {
                        if (tag[tag.length - 1] === '/') { // tag should be at least '<a'
                            tag = ''; // it's just a text (not a tag)
                        }
                        else {
                            tag += ch;
                        }
                    }
                }
                else if (ch === '>') {
                    if (tag) {
                        if (tag.length === 1 || tag.length === 2 && lastCh === '/' || tag.startsWith(docTypeName, 1)) { // tag should be at least '<a' or '<a/'
                            tag = ''; // it was just text
                        }
                        else {
                            tag += ch;
                            let tagName = getTagName(tag);
                            let tagKind = tag.startsWith("</")
                                ?
                                tagKinds.close
                                :
                                tag.endsWith("/>") || voidTags.includes(tagName.toUpperCase())
                                    ?
                                    tagKinds.selfclose
                                    :
                                    tagKinds.open;

                            if (tagKind === tagKinds.close) {
                                let openTag = openTags.pop();

                                if (openTag) { // if we have an open tag we must close it before we can go back to the caller method
                                    if (openTag.name.toUpperCase() !== tagName.toUpperCase())
                                        throw this.er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1); // tested by "Invalid-HTML 1+, 2+, 7"
                                    // else they are neitralizing each other..
                                    if ("script".equal(tagName, true))
                                        inJs = false;
                                }
                                else if (outerWaitTag && outerWaitTag === tagName) {
                                    this.stepBack(blocks, tag.length - 1);
                                    break;
                                }
                                else {
                                    throw this.er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1); // tested by "Invalid-HTML 4", "Code 22"
                                }
                            }
                            else if (tagKind === tagKinds.open) {
                                inJs = "script".equal(tagName, true);
                                openTags.push({ tag: tag, name: tagName, lineNum: this.lineNum, linePos: this.linePos() - tag.length + 1 });
                            }
                            else {
                                // just do nothing (self-close tag)
                            }
                            tag = '';
                        }
                    }
                }
                else if (isSpace) {
                    if (tag) { // within a tag
                        if (lastCh === '<' || lastCh === '/') // '<' or // '</' or '<tag/'
                            tag = ''; // reset tag (it was just a text)
                        else
                            tag += ch;
                    }
                }
                else if (!openTags.length && ch === '}' && (lastLiteral === '>'/* || !block.text*/)) { // the close curly bracket can follow only a tag (not just a text)
                    this.stepBack(blocks, 0);
                    stop = true;
                    break; // return back to the callee code-block..
                }
                else { // any other character
                    if (tag)
                        tag += ch; // tag's insides
                }

                if (isSpace) {
                    if (ch === '\n') {
                        lineLastLiteral = '';
                        this.flushPadding(blocks);
                        block.append(ch);
                    }
                    else { // it's a true- space or tab
                        if (lineLastLiteral) // it's not the beginning of the current line
                            block.append(ch);
                        else // it is the beginning of the  line
                            this.padding += ch; // we still don't know whether this line is going to be a code or HTML
                    }
                }
                else {
                    this.flushPadding(blocks);
                    block.append(ch);
                    lastLiteral = lineLastLiteral = ch;
                }

                lastCh = ch;
                this.fetchChar();
            }

            if (openTags.length) {
                let openTag = openTags[openTags.length - 1];
                throw this.er.missingMatchingEndTag(openTag.tag, openTag.lineNum, openTag.linePos); // tested by "Invalid-HTML 3"
            }

            if (!stop)
                this.flushPadding(blocks);

            this.removeEmptyBlock();
        }

        parseHtmlInsideCode(blocks) {
            log.debug();
            const textQuotes = '\'"';
            var quotes = [];
            var tag = '', openTag = '', openTagName = '', lineLastLiteral = '';
            let openTagLineNum, openTagPos;
            var block = this.newBlock(blockType.html, blocks);
            var lastCh = '';
            let stop = false, inComments = false, inJs = false;

            for (var ch = this.pickChar(); !stop && ch; ch = ch && this.pickChar()) {
                var nextCh = this.pickNextChar();
                let isSpace = Char.isWhiteSpace(ch);

                if (inComments) {
                    if (!tag) {
                        if (ch === '-')
                            tag = ch;
                    }
                    else if (tag.length === 1) {
                        if (ch === '-')
                            tag += ch;
                    }
                    else if (ch === '>') {
                        tag = '';
                        inComments = false;
                    }
                }
                else if (ch === '@') {
                    if (String.isWhiteSpace(block.text)) {
                        // In contrast to a base-HTML-block, here it can only start with an HTML-tag.
                        throw this.er.unexpectedCharacter(ch, this.lineNum, this.linePos(), this.line); // Cannot be tested.
                    }
                    if (this.pickNextChar() === '@') { // checking for '@@' that means just text '@'
                        ch = this.fetchChar(); // skip the next '@'
                    }
                    else if (openTagName || tag) { // it must be an expression somewhere inside HTML  
                        this.fetchChar(); // skip current '@'
                        this.parseCode(blocks);

                        if (tag && (tag === '<' || tag === '</'))
                            tag += '@' + blocks[blocks.length - 1].text + this.padding; // just to be considered as a tag later (for the case of '<@tag>')

                        block = this.newBlock(blockType.html, blocks);
                        continue;
                    }
                    else {
                        throw this.er.unexpectedAtCharacter(this.lineNum, this.linePos()); // [Section 0]
                    }
                }
                else if (quotes.length) { // In Quotes..
                    if (tag) tag += ch;
                    // if in ".." (it's possible only inside the first tag or between tags)
                    if (textQuotes.indexOf(ch) !== -1) { // it could be the closing text qoutes
                        if (quotes[quotes.length - 1] === ch) {
                            quotes.pop(); // collasping quotes..
                        }
                    }
                }
                else if ((tag || inJs) && textQuotes.indexOf(ch) !== -1) { // Open Quotes..
                    if (tag) tag += ch;
                    quotes.push(ch);
                }
                else if (ch === '-') {
                    if (tag.length > 1) { // at least '<!'
                        if (lastCh === '!') {
                            tag += ch;
                        }
                        else if (tag.startsWith("!-", 1)) {
                            tag = '';
                            inComments = true;
                        }
                    }
                    else {
                        tag = '';
                    }
                }
                else if (ch === '<') {
                    if (tag)
                        throw this.er.unexpectedCharacter(ch, this.lineNum, this.line.length, this.line + ch); // tested by "Invalid-HTML 8"

                    if (openTagName) { // it should be a close-tag or another nested html-block
                        if (nextCh !== '/') { // it should be the next nested block of HTML which should be parsed with the normal `parseHtml` method.
                            processInnerHtml.call(this);
                            continue;
                        }
                    }
                    // ELSE it must be the begining an open-tag or a self-close, however it will be a new one on the same deep-level
                    tag = ch;
                }
                else if (ch === '/') {
                    // So, it must be..
                    if (tag) {
                        if (nextCh === '/') { // it can be only considered as html, only as a text-fragment, so parse it as the next level of html..
                            // '<//' or '<a //>', smarter than MS-RAZOR :)
                            processInnerHtml.call(this);
                            continue;
                        }
                        // closing- or self-closing tag ..
                        // '<' or `<a` at least
                        tag += ch;
                    }
                    else {
                        processInnerHtml.call(this);
                        continue;
                    }
                }
                else if (ch === '>') {
                    if (tag) {
                        tag += ch;

                        if (openTagName) {
                            if (tag.length > 2) { // it's a close-tag, at least `</a`
                                let tagName = getTagName(tag);

                                if (openTagName.toUpperCase() !== tagName.toUpperCase())
                                    throw this.er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1); // tested by "Code 22"

                                openTag = openTagName = ''; // open-tag is closed

                                if ("script".equal(tagName, true))
                                    inJs = false;
                            }
                        }
                        else {
                            let tagName = getTagName(tag);

                            if (tag[tag.length - 2] === '/' || voidTags.includes(tagName.toUpperCase())) {
                                // it's a self-close tag... nothing to do
                            }
                            else if (tag.length > 2) { // it's an open-tag, at least `<a>`
                                if (tag[1] === '/') // it's a close-tag, unexpected..
                                    throw this.er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1); // tested by "Invalid-HTML 5"

                                inJs = "script".equal(tagName, true);
                                openTag = tag;
                                openTagName = tagName;
                                openTagPos = this.linePos() - tag.length + 1;
                                openTagLineNum = this.lineNum;
                            }
                            else
                                throw this.er.tagNameExpected(this.lineNum, this.linePos()); // tested by "Code 28"
                        }

                        tag = ''; //  reset it & go on..
                    }
                }
                else if (isSpace) {
                    if (tag) { // within a tag
                        if (lastCh === '<' || lastCh === '/') // '<' or '</' or '<tag/'
                            throw this.er.tagNameExpected(this.lineNum, this.linePos()); // tests: "Code 33", "Code 34"
                        else
                            tag += ch;
                    }
                }
                else { // any other character
                    if (tag) {
                        tag += ch;
                    }
                    else if (openTagName) { // even if it is '}' it will be considered as a plain text
                        processInnerHtml.call(this);
                        continue;
                    }
                    else {
                        // it should be returned back to code-block
                        //this.stepBack(); // step back before `<` literal
                        ch = '';
                        stop = true;
                    }
                }

                if (ch) {
                    if (isSpace) {
                        if (ch === '\n') {
                            lineLastLiteral = '';
                            this.flushPadding(blocks);// flash padding buffer in case this whole line contains only whitespaces ..
                            block.append(ch);
                        }
                        else { // it's a true- space or tab
                            if (lineLastLiteral) // it's not the beginning of the current line
                                block.append(ch);
                            else // it is the beginning of the  line
                                this.padding += ch; // we still don't know whether this line is going to be a code or HTML
                        }
                    }
                    else {
                        this.flushPadding(blocks);
                        block.append(ch);
                        lineLastLiteral = ch;
                    }

                    lastCh = ch[ch.length - 1];
                }

                !stop && this.fetchChar();
            }

            if (openTagName)
                throw this.er.missingMatchingEndTag(openTag, openTagLineNum, openTagPos); // tested by "Invalid-HTML 6", "Code 20", "Code 31"

            if (!stop)
                this.flushPadding(blocks);

            function processInnerHtml() {
                this.stepBack(blocks, tag.length);
                this.parseHtml(blocks, openTagName);
                block = this.newBlock(blockType.html, blocks);
                tag = lastCh = lineLastLiteral = '';
            }
        }

        parseCode(blocks) {
            log.debug();
            var ch = this.pickChar();

            if (!ch)
                throw Error(this.er.endOfFileFoundAfterAtSign(this.lineNum, this.linePos())); // tests: "Code 39"

            if (ch === '{') {
                this.parseJsBlock(blocks);
            }
            else if (canExpressionStartWith(ch)) {
                this.parseJsExpression(blocks);
            }
            else {
                throw this.er.notValidStartOfCodeBlock(ch, this.lineNum, this.linePos()); // tests: "Code 40"
            }
        }

        parseJsExpression(blocks) {
            log.debug();
            const startScopes = '([';
            const endScopes = ')]';
            const textQuotes = '\'"`/';
            var waits = [];
            var wait = null;
            var firstScope = null;
            let lastCh = '';
            let padding = this.padding;
            this.padding = '';
            let block = this.newBlock(blockType.expr, blocks);
            var checkForBlockCode = false;
            let inText = false;
            let operatorName = '';

            for (var ch = this.pickChar(); ch; ch = this.pickChar()) { // pick or fetch ??
                if (checkForBlockCode) {
                    if (Char.isWhiteSpace(ch)) {
                        this.padding += ch;
                    }
                    else if (ch === '{') {
                        //this.flushPadding(blocks);
                        this.padding = padding;
                        block.type = blockType.code;
                        return this.parseJsBlock(blocks, block, operatorName);
                    }
                    else {
                        break;
                    }
                }
                else if (inText) {
                    if (textQuotes.indexOf(ch) !== -1) { // it's some sort of text qoutes
                        if (ch === wait) {
                            wait = waits.pop(); // collasping quotes..
                            inText = false;
                        }
                    }
                }
                else { // if not (inText)
                    let pos = startScopes.indexOf(ch);
                    // IF it's a start-scope literal
                    if (pos !== -1) { // ch === '(' || ch === '['
                        if (!firstScope) {
                            wait = firstScope = endScopes[pos];
                            operatorName = block.text.trim();
                        }
                        else {
                            if (wait)
                                waits.push(wait);
                            wait = endScopes[pos];

                        }
                    }
                    else if (wait) {
                        if (endScopes.indexOf(ch) !== -1) {
                            if (wait === ch) {
                                wait = waits.pop(); // collasping scope..
                                checkForBlockCode = (!wait && ch === firstScope && ch !== ']'); // can continue with "[1,2,3].toString()"
                            }
                            else {
                                throw this.er.invalidExpressionChar(ch, this.lineNum, this.pos, this.line); // Tests: "Code 41".
                            }
                        }
                        else if (textQuotes.indexOf(ch) !== -1 && (ch !== '/' || lastCh !== '<')) { // it's some sort of text qoutes (exclude the case when ch='/' and it's a tag start '</')
                            wait && waits.push(wait);
                            wait = ch;
                            inText = true; // put on waits-stack
                        }
                    }
                    else if (block.text) {
                        let nextCh = this.pickNextChar();

                        if (Char.isWhiteSpace(lastCh) && !Char.isWhiteSpace(ch)) {
                            let op = block.text.trim();
                            if (!['function', 'class', 'try'].some(e => e == op))
                                break;  // [Code 63]: <span>@year is a leap year.</span>
                        }

                        if (!canExpressionEndWith(ch)) {
                            if (Char.isWhiteSpace(ch) || ch === '{') {
                                if (checkForSection.call(this))
                                    return;
                                else if (ch === '{') {
                                    let op = block.text.trim();
                                    if (['do', 'try'].some(e => e == op)) {
                                        operatorName = op;
                                        checkForBlockCode = true;
                                        continue;
                                    }
                                    break;
                                }
                            }
                            else if (ch === '.') { // @Model.text

                                if (!nextCh || !canExpressionEndWith(nextCh))
                                    break;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }

                if (Char.isWhiteSpace(ch)) {
                    if (!checkForBlockCode)
                        this.padding += ch;
                }
                else {
                    if (!checkForBlockCode)
                        this.flushPadding(blocks);

                    block.append(ch);
                }

                lastCh = ch;
                this.fetchChar();
            }

            if (wait)
                throw this.er.expressionMissingEnd('@' + block.text, wait, this.lineNum, this.linePos()); // Tests: "Code 42".

            if (!block.text)
                throw this.er.invalidExpressionChar(ch, this.lineNum, this.linePos(), this.line); // Seems to be impossible.

            flushDeferredPadding(blocks); // there is no sense to put padding to the expression text since it will be lost while evaluating

            function flushDeferredPadding(blocks) {
                if (!padding)
                    return;
                let prevBlock = blocks[blocks.length - 2];
                prevBlock.text += padding;
            }

            function checkForSection() {
                let keyword = block.text.trim();

                if (keyword === _sectionKeyword) {
                    this.blocks.pop();
                    this.parseSection();
                    return true;
                }

                return false;
            }
        }

        parseJsBlock(blocks, block, operatorName) {
            log.debug();
            const startScopes = '{([';
            const endScopes = '})]';
            const textQuotes = '\'"`/';
            var lastCh = '', lastLiteral = '', lineLastLiteral = '';
            var waits = [];
            var wait = null;
            var firstScope = null;
            var stop = false;
            let skipCh = true;
            let inText = false;
            let hasOperator = !!block;
            block = block || this.newBlock(blockType.code, blocks);
            let firstLine = this.line, firstLineNum = this.lineNum, trackFirstLine = true;
            let waitOperator = null, waitAcc = '', operatorExpectScope;

            for (var ch = this.pickChar(); !stop && ch; ch = this.pickChar()) { // pick or fetch ??
                if (trackFirstLine) {
                    trackFirstLine = (ch !== '\n');

                    if (trackFirstLine)
                        firstLine += ch;
                }

                skipCh = false;

                if (waitOperator && ch !== operatorExpectScope) {
                    if (!Char.isWhiteSpace(ch)) {
                        waitAcc += ch;

                        if (waitOperator.startsWith(waitAcc)) {
                            if (waitOperator === waitAcc) {
                                operatorName = waitOperator;
                                waitOperator = null;

                                if (["while", "catch", "if"].some(e => waitAcc === e)) {
                                    operatorExpectScope = '(';
                                }
                                else if ("finally" === waitAcc) {
                                    operatorExpectScope = '{';
                                }
                                else if ("else" === waitAcc) {
                                    operatorExpectScope = '{';
                                    waitOperator = 'if';
                                    waitAcc = '';
                                }
                            }
                        }
                        else {
                            waitOperator = null; // outer html (end of code block)
                            this.stepBack(blocks, waitAcc.length - 1); // [Code 66]
                            break;
                        }
                    }
                    else if (waitAcc) { // there shouldn't be any spaces within the 'waitOperator'
                        if (waitOperator === "while")
                            throw this.er.wordExpected(waitOperator, this.lineNum, this.linePos() - waitAcc.length); // [Code 59]

                        this.stepBack(blocks, waitAcc.length);
                        break;
                    }
                }
                else if (inText) {
                    if (textQuotes.indexOf(ch) !== -1) { // it's some sort of text qoutes
                        if (ch === wait) {
                            wait = waits.pop(); // collasping quotes..
                            inText = false;
                        }
                    }
                }
                else { // if not (inText)
                    if (!firstScope && ch !== '{')
                        throw this.er.characterExpected('{', this.lineNum, this.linePos());

                    if (operatorExpectScope && !Char.isWhiteSpace(ch) && ch !== operatorExpectScope) {
                        if (!waitOperator)
                            throw this.er.characterExpectedAfter(operatorExpectScope, this.lineNum, this.linePos(), operatorName); // [Code 58, Code 66.1, Code 67.1]
                    }

                    let pos = startScopes.indexOf(ch);
                    // IF it's a start-scope literal
                    if (pos !== -1) {
                        if (!firstScope) {
                            wait = firstScope = endScopes[pos];
                            skipCh = !hasOperator; // skip the outer {} of the code-block
                        }
                        else {
                            if (wait) waits.push(wait);
                            wait = endScopes[pos];
                        }

                        if (operatorExpectScope == ch) {
                            //firstScope = wait;
                            operatorExpectScope = null;
                            waitOperator = null;
                        }
                    }
                    else if (wait) {
                        if (endScopes.indexOf(ch) !== -1) { // IF it's an end-scope literal
                            if (wait === ch) {
                                wait = waits.pop(); // collasping scope..
                                if (!wait && (operatorName !== "if" || ch === firstScope)) {
                                    if (ch === '}') { // the last & closing scope..)
                                        switch (operatorName) {
                                            case "try":
                                                waitOperator = "catch";
                                                break;
                                            case "catch":
                                                waitOperator = "finally";
                                                break;
                                            case "if":
                                                waitOperator = "else";
                                                //firstScope = null;
                                                break;
                                            case "do":
                                                waitOperator = "while";
                                                //firstScope = null; Don't do this for 'while' - it shouldn't expect the '{' char after that.
                                                break;
                                            default:
                                                waitOperator = null;
                                        }

                                        operatorName = null;
                                    }
                                    waitAcc = '';
                                    stop = !(waitOperator || operatorName);
                                    skipCh = (ch === '}') && !hasOperator;// skip the outer {} of the code-block
                                }
                            }
                            else {
                                throw this.er.invalidExpressionChar(ch, this.lineNum, this.linePos(), this.line); // Tests: "Code 43".
                            }
                        }
                        else if (textQuotes.indexOf(ch) !== -1) { // it's some sort of text qoutes
                            wait && waits.push(wait);
                            wait = ch;
                            inText = true; // put on waits-stack
                        }
                        else if (ch === '@' && (!lastLiteral || Char.isWhiteSpace(lastLiteral))) {
                            throw this.er.unexpectedAtCharacter(this.lineNum, this.linePos(), this.line); // [Invalid-HTML 9], [Section 1]
                        }
                        else if (ch === '<') {
                            // ':' for `switch/case:`
                            if (lastLiteral === '' || lastLiteral === '{' || lastLiteral === ';' || lastLiteral === ':') {
                                this.stepBack(blocks, 0);
                                this.parseHtmlInsideCode(blocks);
                                block = this.newBlock(blockType.code, blocks);
                                continue;
                            }
                        }
                    }
                    else if (!Char.isWhiteSpace(ch)) {
                        break;
                    }
                }

                if (skipCh) {
                    this.padding = '';
                }
                else {
                    let isSpace = Char.isWhiteSpace(ch);

                    if (isSpace) {
                        if (ch === '\n') {
                            lineLastLiteral = '';
                            this.flushPadding(blocks); // flash padding buffer in case this whole line contains only whitespaces ..
                            block.append(ch);
                        }
                        else { // it's a true- space or tab
                            if (lineLastLiteral) // it's not the beginning of the current line
                                block.append(ch);
                            else // it is the beginning of the  line
                                this.padding += ch; // we still don't know whether this line is going to be a code or HTML
                        }
                    }
                    else {
                        this.flushPadding(blocks);
                        block.append(ch);
                        lastLiteral = lineLastLiteral = ch;
                    }

                    lastCh = ch;
                }

                this.fetchChar();
            }

            if (wait)
                throw this.er.jsCodeBlockMissingClosingChar(firstLineNum, firstLine); // tests: "Code 29"

            if (operatorExpectScope)
                throw this.er.characterExpectedAfter(operatorExpectScope, this.lineNum, this.linePos(), operatorName); // [Code 55]

            if (waitOperator === "while") // all others are optional
                throw this.er.wordExpected(waitOperator, this.lineNum, this.linePos() - waitAcc.length); // [Code 60]

            if (stop) {
                // skip all spaces until a new line
                while (Char.isWhiteSpace(this.pickChar())) {
                    ch = this.fetchChar();
                    if (ch === '\n') break; // a `\n` the last to skip
                }
                this.removeEmptyBlock();
            }
            else {
                this.flushPadding(blocks);
            }
        }

        parseSection() {
            log.debug();
            let sectionStartPos = this.linePos() - _sectionKeyword.length - 1; // -1 for '@'

            if (this.inSection)
                throw this.er.sectionsCannotBeNested(this.lineNum, sectionStartPos); // Tests: "Section 2".

            this.inSection = true;
            let spaceCount = 0;

            for (var ch = this.pickChar(); ch && Char.isWhiteSpace(ch); ch = this.pickChar()) {
                this.fetchChar();
                spaceCount++;
            }

            if (spaceCount < 1)
                throw this.er.whiteSpaceExpectedAfter("@" + _sectionKeyword, this.lineNum, this.linePos()); // unreachable due to previous function check 

            //let sectionLine = this.lineNum; 
            let sectionNamePos = this.linePos();
            let sectionName = '';

            // the section name is expected to be placed before '{' symbol or whitespace
            for (ch = this.pickChar(); ch && !Char.isWhiteSpace(ch) && ch !== '{'; ch = this.pickChar())
                sectionName += this.fetchChar();

            // validation of the section name ..
            if (sectionName.length === 0)
                throw this.er.sectionNameExpectedAfter("@" + _sectionKeyword, this.lineNum, this.linePos()); // Tests: "Section 3".

            if (!canSectionStartWith(sectionName[0]))
                throw this.er.sectionNameCannotStartWith(sectionName[0], this.lineNum, this.linePos() - sectionName.length); // Tests: "Section 5".

            for (var i = 1; i < sectionName.length; i++) {
                let c = sectionName[i];
                if (!canSectionContain(c))
                    throw this.er.sectionNameCannotInclude(c, this.lineNum, this.linePos() - sectionName.length + i); // Tests: "Section 6".
            }

            // check if the section name is unique ..
            let sections = this.args.parsedSections[sectionName];

            if (sections) {
                let section = sections[this.args.filePath]
                if (section)
                    throw this.er.sectionIsAlreadyDefined(sectionName, this.lineNum, sectionNamePos, this.args.filePath); // Tests: "Section 8".
            }
            else {
                this.args.parsedSections[sectionName] = sections = {};
            }

            sections[this.args.filePath] = { name: sectionName, filePath: this.args.filePath, html: '' };

            // skip all following whitespaces ..
            ch = this.skipWhile(c => Char.isWhiteSpace(c));

            if (ch !== '{')
                throw this.er.unexpectedLiteralFollowingTheSection(ch, this.lineNum, this.linePos()); // Tests: "Section 7".

            let sectionBlocks = [];

            this.parseJsBlock(sectionBlocks);

            // skip all following whitespaces ..
            //ch = this.skipWhile(c => Char.isWhiteSpace(c));
            //if (ch !== '}')
            //    throw this.er.sectionBlockIsMissingClosingBrace(sectionName, sectionLine, sectionStartPos); // Tests: "Section 9".

            var block = this.newBlock(blockType.section, this.blocks, sectionName);
            block.blocks = sectionBlocks;
            this.inSection = false;
        }

        //////////////////////////////////////

        flushPadding(blocks) {
            if (!this.padding) return;
            let block = blocks[blocks.length - 1];
            block.text += this.padding;
            this.padding = '';
        }

        pickChar() {
            if (this.pos < this.text.length)
                return this.text[this.pos];

            return '';
        }

        pickNextChar() {
            if (this.pos < this.text.length - 1)
                return this.text[this.pos + 1];

            return '';
        }

        fetchChar() {
            if (this.pos < this.text.length) {
                var ch = this.text[this.pos++];

                if (ch === '\n')
                    this.line = '', this.lineNum++;
                else
                    this.line += ch;

                return ch;
            }

            return '';
        }

        stepBack(blocks, count) {
            if (typeof count === 'undefined')
                throw new Error('`count` is `undefined`.');

            if (typeof count < 0)
                throw new Error('`count` cannot be less than 0.');

            let block = blocks[blocks.length - 1];

            if (count > this.line.length || block.text.length < count)
                throw new Error(`this.stepBack(${count}) is out of range.`);

            var cut;

            if (count > 0) {
                this.pos -= count;
                cut = this.line.length - count;

                if (cut === 0)
                    this.line = '';
                else
                    this.line = this.line.substr(0, cut);
            }

            // adjust blocks..
            if (!block.text.length || block.type === blockType.code && String.isWhiteSpace(block.text)) {
                blocks.pop();
            }
            else if (count > 0) {
                cut = block.text.length - count; // block's text doesn't have the very last character

                if (cut === 0)
                    blocks.pop(); // remove the current block if it's empty
                else
                    block.text = block.text.substr(0, cut);
            }
        }

        linePos() {
            return this.line.length;
        }

        skipWhile(check) {
            let c = this.pickChar();
            while (c && check(c)) {
                this.fetchChar();
                c = this.pickChar();
            }
            return c;
        }

        nextNonSpace() {
            var ch;
            do {
                ch = this.nextChar();
            } while (ch && ch.trim().length === 0);
            return ch;
        }

        startsWith(str) {
            return this.text.startsWithIgnoreCase(this.pos, str);
        }

        take(len) {
            let str = this.text.substr(this.pos, len);
            this.pos += len;
            return str;
        }

        removeEmptyBlock() {
            if (this.blocks.length && !this.blocks[this.blocks.length - 1].text)
                this.blocks.pop();
        }


        newBlock(type, blocks, name) {
            let textPos = (type === blockType.html) ? this.pos : this.pos - 1; // -1 for the skipped "@" symbol in code-blocks and expressions.
            textPos -= this.padding.length;

            if (blocks.length)
                blocks[blocks.length - 1].posEnd = textPos;

            var block = new Block(type, name);
            block.posStart = textPos;

            blocks.push(block);
            return block;
        }
    }

    // class Parser helpers:
    function canSectionStartWith(ch) {
        return ch === '_' || Char.isLetter(ch);
    }

    function canSectionContain(ch) {
        return ch === '_' || Char.isLetter(ch) || Char.isDigit(ch);
    }

    function canExpressionStartWith(ch) {
        return ch === '_' || ch === '$' || ch === '(' || ch === '[' || Char.isLetter(ch);
    }

    function canExpressionEndWith(ch) {

        return ch === '_' || ch === '$' || Char.isLetter(ch) || Char.isDigit(ch);
    }

    function getTagName(tag) {
        if (!tag || tag.length < 2)
            throw this.er.invalidHtmlTag(tag, this.pos, this.line);

        var tagName = '';
        for (var i = 1; i < tag.length; i++) { // skip '<' & '>'
            var ch = tag[i];

            if (ch === '/') continue; // skip '/' for '</div>'
            if (ch === '>') break;

            if (Char.isWhiteSpace(ch)) {
                if (tagName)
                    break;
                else
                    throw this.er.invalidHtmlTag(tag, this.pos - tag.len, this.line);
            }

            tagName += ch;
        }
        return tagName;
    }

    function toParserError(err, errorFactory) {
        if (err.isRazorError) {
            // it could be the 2-nd or most time here from the stack
            // Error.captureStackTrace(err, toParserError);

            // cut everything above (excessive information from the VM in debug mode), for example this:
            // d:\Projects\NodeJS\RazorExpressFullExample\node_modules\raz\core\Razor.js:117
            // throw errorsFactory.partialViewNotFound(path.basename(partialViewName), searchedLocations); // [#2.3]
            // ^
            let pos = err.stack.indexOf("\nError");

            if (pos > 0)
                err.stack = err.stack.substring(pos + 1);
        }

        // Is not "born" as RazorError.
        let isNotRazorError = !err.__dbg && !err.isRazorError;

        if (isNotRazorError || err.__dbg && err.__dbg.viewName !== (err.data && err.data.filename))
            errorFactory.extendError(err);

        return err;
    }

    ////////////////
    //   EXPORTS  //
    ////////////////
    var compile = (args, done) => new Parser(args).compile(done);
    var compileSync = args => new Parser(args).compileSync();

    // Module/Exports..
    return {
        compile: (args, done) => {
            args = prepareArgs(args);
            return compile(args, done);
        },
        compileSync: function () {
            let args = Array.prototype.slice.call(arguments);
            args = prepareArgs(args);
            return compileSync(args).html;
        }
    };

    function prepareArgs(args) {
        if (args.length) { // it's called from `compileSync`
            if (String.is(args[0]))
                args = { template: args[0], model: args[1] }; // arguments are not passed as an object
            else
                args = args[0];
        }

        args.root = true;
        return args;
    }

}; // module.export

},{"./HtmlString":1,"./errors/RazorError":3,"./errors/errors":5,"./libs/js-htmlencode":6,"./utils":8}],8:[function(require,module,exports){
(function (global){
////////////////////////////////////////////////
// String
////////////////////////////////////////////////

if (typeof Utils === 'undefined') Utils = {};

String.whitespaces = '\r\n\t ';

String.is = function(val){
    // return typeof val === "string" || val instanceof String;
    return Object.prototype.toString.call(val) === "[object String]";
}

String.format = String.format || function (format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== 'undefined'
            ? args[number]
            : match
            ;
    });
};

String.isWhiteSpace = String.isWhiteSpace || function (str) {
    return str && str.trim().length === 0;
};

String.prototype.startsWithIC = String.prototype.startsWithIgnoreCase = function (str, pos) {
    pos = pos || 0;

    if (this.length - pos < str.length)
        return false;

    for (let i = 0; i < str.length; i++)
        if (this[i + pos].toLowerCase() !== str[i].toLowerCase())
            return false;

    return true;
};

String.equal = function (s1, s2, ignoreCase, useLocale) {
    if (s1 == null || s2 == null)
        return false;

    if (!ignoreCase) {
        if (s1.length !== s2.length)
            return false;

        return s1 === s2;
    }

    if (useLocale) {
        if (useLocale.length)
            return s1.toLocaleLowerCase(useLocale) === s2.toLocaleLowerCase(useLocale)
        else
            return s1.toLocaleLowerCase() === s2.toLocaleLowerCase()
    }
    else {
        if (s1.length !== s2.length)
            return false;

        return s1.toLowerCase() === s2.toLowerCase();
    }
}

// If you don't mind extending the prototype.
String.prototype.equal = function (string2, ignoreCase, useLocale) {
    return String.equal(this.valueOf(), string2, ignoreCase, useLocale);
}

////////////////////////////////////////////////
// Char
////////////////////////////////////////////////

if (!global.Char) {
    Char = {};
}

if (!Char.isLetter) {
    Char.isLetter = function (c) {
        return c.toLowerCase() !== c.toUpperCase();
    };
}

Char.isDigit = Char.isDigit || function (c) {
    if (!c) return false;
    if (c.length > 1) throw new Error(`Invalid length of argument '${c}'.`);
    return '0123456789'.indexOf(c) !== -1;
};

Char.isWhiteSpace = Char.isWhiteSpace || function (c) {
    if (!c) return false;
    if (c.length > 1) throw new Error(`Invalid length of argument '${c}'.`);
    return String.whitespaces.indexOf(c) !== -1;
};

Char.isIdentifier = function(c){
    return Char.isLetter(c) || Char.isDigit(c) || '_$'.includes(c);
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[2]);
