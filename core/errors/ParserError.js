const htmlEncode = require('js-htmlencode');

/////////////////////////////////////////////////////////////////////////
// https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216
// https://rclayton.silvrback.com/custom-errors-in-node-js
/////////////////////////////////////////////////////////////////////////

module.exports = class ParserError extends Error {
    constructor(message, jshtml, line, pos, len) {
        super(message);
        this.name = this.constructor.name;
        this.data = { message, jshtml, line, pos, len };
        Error.captureStackTrace(this, this.constructor);
    }

    getHtml() {
        if (!this.data.jshtml)
            return;

        let lines = this.stack.split('\n');
        let stack = '<div>';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let encodedLine = htmlEncode(line);
            
            if (line.startsWith("ParserError:"))
                stack += `<span style="font-weight: bold; color: #580a0a;">${encodedLine}</span>`;
            else
                stack += encodedLine;

            stack += '<br/>';
        }

        stack += '</div>';
        lines = this.data.jshtml.split('\n');
        let code = "<ol start='1'>";

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let highlight, htmlLine, comment;

            if (this.data.line === i) {
                highlight = "class='highlight'";
                let pos = this.data.pos;
                let len = this.data.len || 1;

                if (typeof pos !== 'undefined' && pos < line.length) {
                    let start = htmlEncode(line.substring(0, pos));
                    let one = htmlEncode(line.substring(pos, pos + len));
                    let end = htmlEncode(line.substring(pos + len + 1));
                    htmlLine = `<span>${start}</span><span class='highlight'>${one}</span><span>${end}</span>`;
                }
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
        }

        code += "</ol>";

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
            color: #196684;//darkslategray;
        }
        ol li.highlight span {
            color: black;
        }
        ol li span.highlight {
            border: solid 1px red;
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
        An error occurred during the compilation of a 'jshtml' page required to process this request.
    </h1>
    <div class="stack">${stack}</div>
    <hr />
    <h2>Page markup</h2>
    <div class="code">
        ${code}
    <div>
</body>
</html>
`;
        return html;
    }
}