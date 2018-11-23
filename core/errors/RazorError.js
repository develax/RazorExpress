const htmlEncode = require('js-htmlencode');

/////////////////////////////////////////////////////////////////////////
// https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216
// https://rclayton.silvrback.com/custom-errors-in-node-js
/////////////////////////////////////////////////////////////////////////

const regex = /.*Error:/;

module.exports = class RazorError extends Error {
    constructor(message, source, line, pos, len) {
        super(message);
        this.name = this.constructor.name;
        this.data = Object.assign({ line, pos, len }, source);
        Error.captureStackTrace(this, this.constructor);
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

            if (line && line.trim() === "^" || nextLine && nextLine.trim() === "^" || regex.exec(line)) {
                style = 'class="main"';
                mainInfo += encodedLine;
            }

            stack += `<span ${style}>${encodedLine}</span><br/>`;
        }

        stack += '</div>';
        let code;

        if (this.data.jshtml) {
            lines = this.data.jshtml.split('\n');
            code = "<ol start='1'>";

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
                        htmlLine = `<span>${start}</span><span class='highlight' title='${mainInfo}'>${one}</span><span>${end}</span>`;
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
            color: red;
            white-space: pre-wrap;
        }
        ol {
            color: darkgray;
        }
        ol li {
            background-color: #fbfbfb;
            white-space: pre-wrap;
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