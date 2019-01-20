const htmlEncode = require('../libs/js-htmlencode');

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
        const { isDebugMode, isBrowser } = require('../dbg/debugger');
        exc.isRazorError = true;

        if (!isDebugMode)
        {
            exc.html = () => {
                const errorRefUrl = (isBrowser) ? "https://www.npmjs.com/package/razjs#example-2-handling-and-displaying-errors" : "https://github.com/DevelAx/RazorExpress/blob/master/docs/Debugging.md#production--development-modes";
                const error = `Razor template compilation error occured.<br/>Turn <a href="${errorRefUrl}" target="_blank">DEBUG MODE</a> on to get details.`;
                
                if (isBrowser)
                    return `<div style="color: red;">${htmlEncode(exc.message)}</div><hr/>${error}`;
                else
                    return error;
            }
            return;
        }

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

        if (mainInfo.title && !pointer){
            var trim = line.substring(dLen);
            var pointer = trim;
        }
        else{
            trim = line.trim();
        }

        var dLen = line.length - trim.length;
        let encodedLine = htmlEncode(trim);
        let style = '';

        if (trim && trim !== '^' && !trim.startsWith("at ")) {
            if (trim.startsWith('RazorError') || mainInfo.title){
                style = 'id="error" class="error"'; // the second line is the error description
            }
            else {
                mainInfo.errorLine = trim;
                style = 'class="error"';
            }
                
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
        let isLastData = !data.inner;
        let hasErrorCoordinates = data.posRange && data.posRange.start || data.pos;

        if (isLastData && !hasErrorCoordinates && mainInfo.errorLine) {
            let occur = data.jshtml.numberOfOccurrences(mainInfo.errorLine);

            if (occur.num === 1) {
                let extend = 0;

                if (occur.pos > 0 && data.jshtml[occur.pos - 1] === '@')
                    extend = 1; // Include the '@' symbol for beauty.

                data.posRange = {
                    start: occur.pos - extend,
                    end: occur.pos + mainInfo.errorLine.length
                };
            }
        }

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