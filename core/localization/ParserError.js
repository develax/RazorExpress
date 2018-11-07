const htmlEncode = require('js-htmlencode');

/////////////////////////////////////////////////////////////////////////
// https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216
// https://rclayton.silvrback.com/custom-errors-in-node-js
/////////////////////////////////////////////////////////////////////////

module.exports = class ParserError extends Error {
    constructor(message, jshtml, line, pos) {
        super(message);
        this.name = this.constructor.name;
        this.data = { message, jshtml, line, pos };
        Error.captureStackTrace(this, this.constructor);
    }

    getFormatted() {
        if (!this.data.jshtml)
            return;

        let lines = this.stack.split('\n');
        let stack = '<div>';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (i === 0)
                stack += `<span style="font-weight: bold;">${line}</span>`;
            else
                stack += line;

            stack += '<br/>';
        }

        stack += '</div>';
        lines = this.data.jshtml.split('\n');
        let code = "<ol start='1'>";

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let highlight, htmlLine;

            if (this.data.line === i) {
                highlight = "class='highlight'";
                let pos = this.data.pos;

                if (typeof pos !== 'undefined' && pos < line.length) {
                    let start = htmlEncode(line.substring(0, pos));
                    let one = htmlEncode(line[pos]);
                    let end = htmlEncode(line.substring(pos + 1));
                    htmlLine = `<span>${start}</span><span class='highlight'>${one}</span><span>${end}</span>`;
                }
            }

            code += `<li ${highlight}><span>`;
            code += htmlLine ? htmlLine : htmlEncode(line);
            code += "</span></li>";
        }

        code += "</ol>";

        var html = `
<!DOCTYPE html>
<html>
<head>
    <style type="text/css" scoped>
        h1{
            font-weight: normal;
        }
        body { 
            font-size: .813em;
            font-family: Consolas, "Courier New", courier, monospace;
        }
        .stack{
            color: #328386;
        }
        ol {
            color: darkgray;
        }
        ol li {
            background-color: #fbfbfb;
            white-space: pre;
        }
        ol li.highlight{
            color: darkslategray;
            background-color: #f8f9b3; 
        }
        ol li span {
            color: darkslategray;
        }
        ol li.highlight span {
            color: black;
        }
        ol li span.highlight {
            border: solid 1px red;
        }
    </style>
</head>
<body>
    <h1>
        An error occurred during the compilation of a 'jshtml' page required to process this request.
    </h1>
    <div class="stack">${stack}</div>
    <hr />
    <div class="code">
        ${code}
    <div>
</body>
</html>
`;
        return html;
    }
}