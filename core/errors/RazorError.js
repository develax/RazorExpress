const htmlEncode = require('js-htmlencode');

/////////////////////////////////////////////////////////////////////////
// https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216
// https://rclayton.silvrback.com/custom-errors-in-node-js
/////////////////////////////////////////////////////////////////////////

// const regex = /.*Error:/;

module.exports = class RazorError extends Error {
    constructor(message, templateInfo, line, pos, len, captureFrame, posRange) {
        super(message);
        this.name = this.constructor.name;
        this.data = Object.assign({ line, pos, len, posRange }, templateInfo);

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, captureFrame || this.constructor);
    }

    static new(args) {
        return new RazorError(args.message, args.info, args.line, args.pos, args.len, args.capture || this.new, args.posRange);
    }

    html() {
        let mainInfo = '';
        let lines = this.stack.split('\n');
        let stack = '<div>';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (i === 0 && line.startsWith("evalmachine."))
                continue; // ignore the very first line like "evalmachine.<anonymous>:22"

            let nextLine = (i < lines.length - 1) ? lines[i + 1] : null;
            let encodedLine = htmlEncode(line);
            let style = '';

            // if (line && line.trim() === "^" || nextLine && nextLine.trim() === "^" || regex.exec(line)) {
            //     style = 'class="main"';
            //     mainInfo += encodedLine;
            // }
            if (line && !line.trim().startsWith("at ")) {
                style = 'class="main"';
                mainInfo += encodedLine;
            }

            stack += `<span ${style}>${encodedLine}</span><br/>`;
        }

        stack += '</div>';
        let code;

        if (this.data.jshtml) {
            let textCursor = 0;
            lines = this.data.jshtml.split('\n');
            code = "<ol start='1'>";

            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let highlight, htmlLine, comment, multilight;
                let textCursorEnd = textCursor + line.length + 1; // + '\n'

                if (this.data.posRange && this.data.posRange.start < this.data.posRange.end) {
                    if (this.data.posRange.start >= textCursor && this.data.posRange.start < textCursorEnd) {
                        var pos = this.data.posRange.start - textCursor;

                        if (this.data.posRange.end < textCursorEnd) {
                            var len = this.data.posRange.end - this.data.posRange.start;
                            this.data.posRange = null; // prevent further useless computation during the next iterations of this cycle
                        }
                        else {
                            len = line.length;
                            this.data.posRange.start = textCursorEnd; // move to the beginning of the next line
                        }

                        multilight = "multilight";
                    }
                }
                else if (this.data.line === i) {
                    pos = this.data.pos;
                    len = this.data.len || 1;
                }

                if (pos != null && typeof pos !== 'undefined') {
                    if (pos < line.length) {
                        let start = htmlEncode(line.substring(0, pos));
                        let one = htmlEncode(line.substring(pos, pos + len));
                        let end = htmlEncode(line.substring(pos + len + 1));
                        htmlLine = `<span>${start}</span><span class='${multilight || "highlight"}' title='${mainInfo}'>${one}</span><span>${end}</span>`;
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

                code += `<li ${comment || highlight}><span>`;
                code += htmlLine ? htmlLine : htmlEncode(line);
                code += "</span></li>";

                textCursor = textCursorEnd;
            }// for

            code += "</ol>";
            code = `
<h2>${this.data.filename}</h2></div>
<div class="code">
    ${code}
<div>
`;
        }// if (this.data.jshtml)

        var html = `
<!DOCTYPE html>
<html>
<head>
    <style type="text/css" scoped>
        h1, h2, h3{
            font-weight: normal;
        }
        body { 
            font-size: .813em;
            font-family: Consolas, "Courier New", courier, monospace;
        }
        .stack{
            color: orange;
            white-space: pre;
        }
        .stack .main{
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
    </style>
</head>
<body>
    <h1>
        A template compilation error occured
    </h1>
    <div class="stack">${stack}</div>
    <hr />
    ${code}
</body>
</html>
`;
        return html;
    }
}