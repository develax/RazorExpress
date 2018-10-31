'use strict';

require('./utils');

function compilePageSync(Html, Model, debug) {
    //console.log("DEBUG = " + debug);
    'use strict';
    var code = Html._js;

    if (debug) {
        let sandbox = Html._sandbox;
        let vm = Html._vm;
        sandbox.Html = Html;
        sandbox.Model = Model;
        vm.runInNewContext(code, sandbox);
    }
    else {
        try {
            eval(code);
        }
        catch (exc) {
            throw new Error(exc.message); // cut the useless stacktrace
        }
    }

    return;
}

function compilePage(Html, Model, debug, done) {
    try {
        compilePageSync(Html, Model, debug);
        return Html.__renderLayout(done);
    }
    catch (exc) {
        return Promise.resolve().then(() => done(exc)), null;
    }
}


module.exports = function (opts) {
    opts = opts || {};
    const log = require('./logger')({ off: !opts.debug });
    log.debug = () => { };// turn off temporarily 
    log.debug(`Debug mode is '${!!opts.debug}'.`);

    const vm = opts.debug ? require('vm') : null;
    const sandbox = opts.debug ? Object.create(null) : null;

    if (sandbox)
        vm.createContext(sandbox);

    function Html(args) {
        // Non-user section.
        this._vm = vm;
        this._sandbox = sandbox;
        // function (process,...){...}() prevents [this] to exist for the 'vm.runInNewContext()' method
        this._js = `
(function (process, window, global, module, compilePage, compilePageSync, code, undefined) { 
    'use strict';
    delete Html._js;
    delete Html._vm;
    delete Html._sandbox;
    ${args.js};
}).call();`;
        // User section.
        this.layout = null;
        // Private
        let section = null;
        let sections = args.sections || {};

        this.__rnd = function (val) { // render
            if (section) {
                if (!sections[section])
                    sections[section] = { html: '' };

                sections[section].html += val;
            }
            else {
                args.html += val;
            }
        };

        this.__val = function (i) { // getValueAt
            return args.valuesQueue.getAt(i);
        };

        this.__sec = function (name) { // section
            if (!section)
                section = name;
            else if (section === name)
                section = null;
            else
                throw new Error(`Unexpected section name = '${name}'.`);
        };

        this.__renderLayout = (done) => {
            if (!this.layout)
                return Promise.resolve().then(() => done(null, args.html)), null;

            args.findPartial(this.layout, (err, jsHtml, findPartial) => {
                if (err) return done(err);
                let compileOpt = {
                    jsHtml,
                    model: args.model,
                    bodyHtml: args.html,
                    sections,
                    findPartial,
                    findPartialSync: args.findPartialSync
                };
                compile(compileOpt, done);
            });
        };

        this.body = function () {
            return args.bodyHtml;
        };

        this.section = function (name, required) {
            let sec = sections[name];

            if (sec) {
                if (sec.rendered)
                    throw new Error(`The section '${name}' has already been rendered.`); // TODO: InvalidOperationException: RenderSectionAsync invocation in '/Views/Shared/_LayoutYellow.cshtml' is invalid. The section 'Scripts' has already been rendered.

                return sec.html;
            }
            else {
                if (required)
                    throw new Error(`The layout page cannot find the section '${name}'.`); // TODO: InvalidOperationException: The layout page '/Views/Shared/_Layout.cshtml' cannot find the section 'Test' in the content page '/Views/Home/Index.cshtml'.

                return '';
            }

            // TODO: throw error that section was not rendered.
        };

        this.partial = function (name, model) {
            // if an exception occurs it will be thron directly to to ExpressApp and shown on the users' page (fix later):
            // https://expressjs.com/en/guide/error-handling.html
            let p = args.findPartialSync(name);
            let compileOpt = {
                jsHtml: p.data,
                model,
                findPartialSync: args.findPartialSync
            };
            let html = compileSync(compileOpt);
            args.html += html;
            return ''; // for the case of call as expression <div>@Html.partial()</div>
        };
    }

    class Block {
        constructor(type, name) {
            this.type = type;
            this.name = name;
            this.text = '';
        }

        append(ch) {
            this.text += ch;
            //this.text += (ch === '"') ? '\\"' : ch;
        }

        toScript(valuesQueue) {
            return toScript(this, valuesQueue);
        }
    }

    function toScript(block, valuesQueue) {
        if (block.type === type.section) {
            let secPoint = `\r\nHtml.__sec("${block.name}");\r\n`;
            let script = secPoint;

            for (let n = 0; n < block.blocks.length; n++) {
                let sectionBlock = block.blocks[n];
                script += toScript(sectionBlock, valuesQueue);
            }

            script += secPoint;
            return script;
        }
        else {
            let i;

            switch (block.type) {
                case type.html:
                    i = valuesQueue.enq(block.text);
                    return "Html.__rnd(Html.__val(" + i + "));";
                case type.expr:
                    i = valuesQueue.enq(block.text);
                    return "Html.__rnd(eval(Html.__val(" + i + ")));";
                case type.code:
                    return block.text;
                default:
                    throw new Error(`Unexpected block type = "${blockType}".`);
            }
        }

        throw new Error(`Unexpected code behaviour, block type = "${blockType}".`);
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

        //deq() {
        //    if (opts.debug) {
        //        let item = this._items.shift();
        //        log.debug(item);
        //        return item;
        //    }
        //    else {
        //        return this._items.shift();
        //    }
        //}
    }

    const _sectionKeyword = "section";
    //const _functionKeyword = "function";
    const type = { none: 0, html: 1, code: 2, expr: 3, section: 4 };
    const er = require('./localization/errors').parser;

    ////////////////
    //   PARSER   //
    ////////////////
    class Parser {
        constructor(args, log) {
            this.args = args;
            this.log = log;
        }

        compile(done) {
            // checking arguments..
            let jshtml = this.args.jsHtml;
            let model = this.args.model;
            var isString = Object.prototype.toString.call(jshtml) === "[object String]";
            if (!isString) return Promise.resolve().then(() => done(er.jshtmlShouldBeString)), null;
            if (!jshtml.length) return Promise.resolve().then(() => done(null, "")), null; // just an empty string.. nothing to do..

            //////////////////////////////////////
            // parsing.. 

            this.text = jshtml, this.line = '', this.lineNum = 0, this.pos = 0, this.padding = '';
            this.inSection = false;
            this.sections = [], this.blocks = [];
            this.parseHtml(this.blocks);
            var valuesQueue = new Queue();
            var js = this.blocks.map(b => b.toScript(valuesQueue)).join("");
            var htmlArgs = {
                html: '',
                valuesQueue,
                js,
                model,
                bodyHtml: this.args.bodyHtml,
                findPartial: this.args.findPartial,
                findPartialSync: this.args.findPartialSync,
                sections: this.args.sections
            };
            var html = new Html(htmlArgs);
            compilePage(html, model, opts.debug, done);
        }

        compileSync() {
            let jshtml = this.args.jsHtml;
            let model = this.args.model;
            // checking arguments..
            var isString = Object.prototype.toString.call(jshtml) === "[object String]";
            if (!isString) throw new Error(er.jshtmlShouldBeString);
            if (!jshtml.length) return jshtml; // just an empty string.. nothing to do..
            //////////////////////////////////////
            // parsing.. 
            this.text = jshtml, this.line = '', this.lineNum = 0, this.pos = 0, this.padding = '';
            this.inSection = false;
            this.sections = [], this.blocks = [];
            this.parseHtml(this.blocks);
            var valuesQueue = new Queue();
            var js = this.blocks.map(b => b.toScript(valuesQueue)).join("");
            var htmlArgs = {
                html: '',
                valuesQueue,
                js,
                findPartialSync: this.args.findPartialSync,
                model,
                sections: this.args.sections
            };
            var html = new Html(htmlArgs);
            compilePageSync(html, model, opts.debug);
            return htmlArgs.html;
        }

        parseHtml(blocks, outerWaitTag) {
            const docTypeName = "!DOCTYPE";
            const textQuotes = '\'"';
            var quotes = [];
            const tagKinds = { open: 0, close: 1, selfclose: 2 };
            var openTags = [];
            let openTagLineNum, openTagPos, openTagLine;
            var tag = '', lineLastLiteral = '', lastLiteral = '';
            var block = newBlock(type.html, blocks);
            let stop = false;
            var lastCh = '';

            for (var ch = this.pickChar(); ch; ch = this.pickChar()) {
                let isSpace = Char.isWhiteSpace(ch);
                let nextCh = this.pickNextChar();
                let inQuotes = (quotes.length > 0);

                if (ch === '@') {
                    if (nextCh === '@') { // checking for '@@' that means just text '@'
                        ch = this.fetchChar(); // skip the next '@'
                        nextCh = this.pickNextChar();
                    }
                    else {
                        this.fetchChar();
                        this.parseCode(blocks);
                        block = newBlock(type.html, blocks);
                        continue;
                    }
                }
                else if (inQuotes) {
                    if (textQuotes.indexOf(ch) !== -1) { // it could be closing text qoutes
                        if (quotes.length && quotes[quotes.length - 1] === ch) {
                            quotes.pop(); // collasping quotes..
                            inQuotes = false;
                        }
                    }
                }
                else if (textQuotes.indexOf(ch) !== -1) { // it could be opening text qoutes
                    quotes.push(ch);
                    inQuotes = true;
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
                            let tagKind = tag.startsWith("</") ? tagKinds.close : tag.endsWith("/>") ? tagKinds.selfclose : tagKinds.open;

                            if (tagKind === tagKinds.close) {
                                let openTag = openTags.pop();

                                if (openTag) { // if we have an open tag we must close it before we can go back to the caller method
                                    if (openTag.name.toUpperCase() !== tagName.toUpperCase())
                                        throw new Error(er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1, this.line + ch)); // tested by "Invalid-HTML 1+, 2+, 7"
                                    // else they are neitralizing each other..
                                }
                                else if (outerWaitTag && outerWaitTag === tagName) {
                                    this.stepBack(blocks, tag.length - 1);
                                    break;
                                }
                                else {
                                    throw new Error(er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1, this.line + ch)); // tested by "Invalid-HTML 4", "Code 22"
                                }
                            }
                            else if (tagKind === tagKinds.open) {
                                openTags.push({ tag: tag, name: tagName, lineNum: this.lineNum, linePos: this.linePos() - tag.length + 1, line: this.line + ch });
                            }
                            else {
                                // just do nothing
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
                else if (!openTags.length && ch === '}' && lastLiteral === '>') { // the close curly bracket can follow only a tag (not just a text)
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
                        this.flushPadding();
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
                    this.flushPadding();
                    block.append(ch);
                    lastLiteral = lineLastLiteral = ch;
                }

                lastCh = ch;
                this.fetchChar();
            }

            if (openTags.length) {
                let openTag = openTags[openTags.length - 1];
                throw new Error(er.missingMatchingEndTag(openTag.tag, openTag.lineNum, openTag.linePos, openTag.line)); // tested by "Invalid-HTML 3"
            }

            if (!stop)
                this.flushPadding();
        }

        parseHtmlInsideCode(blocks) {
            const docTypeName = "!DOCTYPE";
            const textQuotes = '\'"';
            var quotes = [];
            var tag = '', openTag = '', openTagName = '', lineLastLiteral = '';
            let openTagLineNum, openTagPos, openTagLine;
            var block = newBlock(type.html, blocks);
            var lastCh = '';
            let stop = false;

            for (var ch = this.pickChar(); !stop && ch; ch = ch && this.pickChar()) {
                var nextCh = this.pickNextChar();
                let isSpace = Char.isWhiteSpace(ch);

                if (ch === '@') {
                    if (String.isWhiteSpace(block.text)) {
                        // In contrast to a base-HTML-block, here it can only start with an HTML-tag.
                        throw new Error(er.unexpectedCharacter(ch, this.lineNum, this.linePos(), this.line)); // cannot be tested, just for insurance
                    }
                    if (this.pickNextChar() === '@') { // checking for '@@' that means just text '@'
                        ch = this.fetchChar(); // skip the next '@'
                    }
                    else {
                        this.fetchChar(); // skip current '@'
                        this.parseCode(blocks);

                        if (tag && (tag === '<' || tag === '</'))
                            tag += '@' + blocks[blocks.length - 1].text; // just to be considered as a tag later (for the case of '<@tag>')

                        block = newBlock(type.html, blocks);
                        continue;
                    }
                }
                else if (quotes.length) { // In Quotes..
                    // if in ".." (it's possible only inside the first tag or between tags)
                    if (textQuotes.indexOf(ch) !== -1) { // it could be the closing text qoutes
                        if (quotes[quotes.length - 1] === ch) {
                            quotes.pop(); // collasping quotes..
                        }
                    }
                }
                else if (textQuotes.indexOf(ch) !== -1) { // Open Quotes..
                    quotes.push(ch);
                }
                else if (ch === '<') {
                    if (tag)
                        throw new Error(er.unexpectedCharacter(ch, this.lineNum, this.line.length, this.line + ch)); // tested by "Invalid-HTML 8"

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
                                    throw new Error(er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1, this.line)); // tested by "Code 22"

                                openTag = openTagName = ''; // open-tag is closed
                            }
                        }
                        else {
                            if (tag[tag.length - 2] === '/') {
                                // it's a self-close tag... nothing to do
                            }
                            else if (tag.length > 2) { // it's an open-tag, at least `<a>`
                                let tagName = getTagName(tag);

                                if (tag[1] === '/') // it's a close-tag, unexpected..
                                    throw new Error(er.missingMatchingStartTag(tag, this.lineNum, this.linePos() - tag.length + 1, this.line + ch)); // tested by "Invalid-HTML 5"

                                openTag = tag;
                                openTagName = tagName;
                                openTagPos = this.linePos() - tag.length + 1;
                                openTagLineNum = this.lineNum;
                                openTagLine = this.line + ch;
                            }
                            else
                                throw new Error(er.tagNameExpected(this.lineNum, this.linePos(), this.line)); // tested by "Code 28"
                        }

                        tag = ''; //  reset it & go on..
                    }
                }
                else if (isSpace) {
                    if (tag) { // within a tag
                        if (lastCh === '<' || lastCh === '/') // '<' or '</' or '<tag/'
                            throw new Error(er.tagNameExpected(this.lineNum, this.linePos(), this.line)); // tests: "Code 33", "Code 34"
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
                            this.flushPadding();// flash padding buffer in case this whole line contains only whitespaces ..
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
                        this.flushPadding();
                        block.append(ch);
                        lineLastLiteral = ch;
                    }

                    lastCh = ch[ch.length - 1];
                }

                !stop && this.fetchChar();
            }

            if (openTagName)
                throw new Error(er.missingMatchingEndTag(openTag, openTagLineNum, openTagPos, openTagLine)); // tested by "Invalid-HTML 6", "Code 20", "Code 31"

            if (!stop)
                this.flushPadding();

            function processInnerHtml() {
                this.stepBack(blocks, tag.length);
                this.parseHtml(blocks, openTagName);
                block = newBlock(type.html, blocks);
                tag = lastCh = lineLastLiteral = '';
            }
        }

        parseCode(blocks) {
            var ch = this.pickChar();
            if (!ch) throw er.endOfFileFoundAfterAtSign; // TODO: test me.

            if (ch === '{') {
                this.parseJsBlock(blocks);
            }
            else if (canExpressionStartWith(ch)) {
                this.parseJsExpression(blocks);
            }
            else {
                throw er.notValidStartOfCodeBlock(ch, this.lineNum, this.pos);
            }
        }

        parseJsExpression(blocks) {
            const startScopes = '([';
            const endScopes = ')]';
            const textQuotes = '\'"`';
            var lastCh = '';
            var waits = [];
            var wait = null;
            var firstScope = null;
            let firstKeyword = '';
            this.flushPadding();// there is no sense to put padding to the expression text since it will be lost while evaluating
            let block = newBlock(type.expr, blocks);
            block.text = this.padding;
            this.padding = '';
            var checkForBlockCode = false;
            let scopeCollapsed;
            let inText = false;

            for (var ch = this.pickChar(); ch; ch = this.pickChar()) { // pick or fetch ??
                if (checkForBlockCode) {
                    if (Char.isWhiteSpace(ch)) {
                        this.padding += ch;
                    }
                    else if (ch === '{') {
                        this.flushPadding();
                        block.type = type.code;
                        return this.parseJsBlock(blocks, block);
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
                        }
                        else {
                            if (wait) waits.push(wait);
                            wait = endScopes[pos];
                        }
                    }
                    else if (wait) {
                        if (endScopes.indexOf(ch) !== -1) {
                            if (wait === ch) {
                                wait = waits.pop(); // collasping scope..
                                checkForBlockCode = (!wait && ch === firstScope && ch !== ']'); // can continue with `[1,2,3].toString()`
                            }
                            else {
                                throw er.invalidExpressionChar(ch, this.lineNum, this.pos, this.line);
                            }
                        }
                        else if (textQuotes.indexOf(ch) !== -1) { // it's some sort of text qoutes
                            wait && waits.push(wait);
                            wait = ch;
                            inText = true; // put on waits-stack
                        }
                    }
                    else if (block.text && !canExpressionEndWith(ch)) {
                        if (Char.isWhiteSpace(ch)) {
                            let keyword = block.text.trim();
                            if (keyword === _sectionKeyword) {
                                this.blocks.pop();
                                return this.parseSection();
                            }

                            break;
                        }
                        else if (ch === '.') { // @Model.text
                            let nextCh = this.pickNextChar();
                            if (!nextCh || !canExpressionEndWith(nextCh))
                                break;
                        }
                        else {
                            break;
                        }
                    }
                }
                block.append(ch);
                lastCh = ch;
                this.fetchChar();
            }

            if (wait)
                throw er.expressionMissingEnd('@' + block.text, wait, this.lineNum, this.pos);

            if (!block.text)
                throw er.invalidExpressionChar(ch, this.lineNum, this.pos, this.line);
        }

        parseJsBlock(blocks, block) {
            const startScopes = '{([';
            const endScopes = '})]';
            const textQuotes = '\'"`';
            var lastCh = '', lastLiteral = '', lineLastLiteral = '';
            var waits = [];
            var wait = null;
            var firstScope = null;
            var stop = false;
            let skipCh = true;
            let inText = false;
            let hasOperator = !!block;
            block = block || newBlock(type.code, blocks);

            for (var ch = this.pickChar(); !stop && ch; ch = this.pickChar()) { // pick or fetch ??
                skipCh = false;
                if (inText) {
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
                            skipCh = (ch === '{') && !hasOperator; // skip the outer {} of the code-block
                        }
                        else {
                            if (wait) waits.push(wait);
                            wait = endScopes[pos];
                        }
                    }
                    else if (wait) {
                        if (endScopes.indexOf(ch) !== -1) { // IF it's an end-scope literal
                            if (wait === ch) {
                                wait = waits.pop(); // collasping scope..
                                if (!wait && ch === firstScope) { // the last & closing scope..
                                    stop = true;
                                    skipCh = (ch === '}') && !hasOperator;// skip the outer {} of the code-block
                                }
                            }
                            else {
                                throw er.invalidExpressionChar(ch, this.lineNum, this.pos, this.line);
                            }
                        }
                        else if (textQuotes.indexOf(ch) !== -1) { // it's some sort of text qoutes
                            wait && waits.push(wait);
                            wait = ch;
                            inText = true; // put on waits-stack
                        }
                        else if (ch === '<') {
                            if (lastLiteral === '' || lastLiteral === '{' || lastLiteral === ';') {
                                if (!block.text.length || String.isWhiteSpace(block.text))
                                    this.blocks.pop();
                                this.parseHtmlInsideCode(blocks);
                                block = newBlock(type.code, blocks);
                                continue;
                            }
                        }
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
                            this.flushPadding(); // flash padding buffer in case this whole line contains only whitespaces ..
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
                        this.flushPadding();
                        block.append(ch);
                        lastLiteral = lineLastLiteral = ch;
                    }

                    lastCh = ch;
                }

                this.fetchChar();
            }

            if (wait)
                throw new Error(er.jsCodeBlockkMissingClosingChar(this.lineNum, '@' + (hasOperator ? block.text : '{'))); // tests: "Code 29"

            if (stop) {
                // skip all spaces until a new line
                while (Char.isWhiteSpace(this.pickChar())) {
                    ch = this.fetchChar();
                    if (ch === '\n') break; // a `\n` the last to skip
                }
            }
            else {
                this.flushPadding();
            }
        }

        parseSection() {
            if (this.inSection)
                throw new Error(er.sectionsCannotBeNested(this.lineNum, this.line.length, this.line));

            this.inSection = true;
            let spaceCount = 0;

            for (var ch = this.pickChar(); ch && Char.isWhiteSpace(ch); ch = this.pickChar()) {
                this.fetchChar();
                spaceCount++;
            }

            if (spaceCount < 1) throw er.whitespaceExpectedAfter("@" + _sectionKeyword, this.lineNum, this.line.length);

            let sectionLine = this.lineNum, sectionPos = this.line.length;
            let sectionName = '';
            // the section name is expected to be placed before '{' symbol or whitespace
            for (ch = this.pickChar(); ch && !Char.isWhiteSpace(ch) && ch !== '{'; ch = this.pickChar())
                sectionName += this.fetchChar();

            // validation of the section name ..
            if (sectionName.length === 0)
                throw er.sectionNameExpectedAfter("@" + _sectionKeyword, this.lineNum, this.line.length);

            if (!canSectionStartWith(sectionName[0]))
                throw er.sectionNameCannotStartWith(sectionName[0], this.lineNum, this.line.length);

            for (var i = 1; i < sectionName.length; i++) {
                let c = sectionName[i];
                if (!canSectionContain(c))
                    throw er.sectionNameCannotInclude(sectionName[0], this.lineNum, this.line.length);
            }
            // skip all following whitespaces ..
            ch = this.skipWhile(c => Char.isWhiteSpace(c));

            if (ch !== '{')
                throw er.unexpectedLiteralFollowingTheSection(ch, this.lineNum, this.line.length);

            // check if the section name is unique ..
            let section = this.sections.find(s => sectionName === s);

            if (section)
                throw new Error(er.sectionIsAlreadyDefined(sectionName, this.lineNum, this.line.length));

            this.sections.push(sectionName);
            let sectionBlocks = [];
            this.parseHtmlInsideCode(sectionBlocks);

            // skip all following whitespaces ..
            ch = this.skipWhile(c => Char.isWhiteSpace(c));

            if (ch !== '}')
                throw new Error(er.sectionBlockIsMissingClosingBrace(sectionName, sectionLine, sectionPos));

            var block = newBlock(type.section, this.blocks, sectionName);
            block.blocks = sectionBlocks;
            this.inSection = false;
        }

        //////////////////////////////////////

        flushPadding() {
            if (!this.padding) return;
            let block = this.blocks[this.blocks.length - 1];
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
            if (typeof count === 'undefined') throw new Error('`count` is `undefined`.');
            if (typeof count < 0) throw new Error('`count` cannot be less than 0.');

            let block = blocks[blocks.length - 1];

            if (count > this.line.length || block.text.length < count)
                throw `this.stepBack(${count}) is out of range.`;

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
            if (!block.text.length) {
                this.blocks.pop();
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
            let c = this.fetchChar();
            while (c && check(c)) c = this.fetchChar();
            //if (!c) throw new Error(er.unexpectedEndOfFile(this.line));
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

    function newBlock(type, blocks, name) {
        var block = new Block(type, name);
        blocks.push(block);
        return block;
    }

    function getTagName(tag) {
        if (!tag || tag.length < 2) throw er.invalidHtmlTag(tag);
        var tagName = '';
        for (var i = 1; i < tag.length; i++) { // skip '<' & '>'
            var ch = tag[i];

            if (ch === '/') continue; // skip '/' for '</div>'
            if (ch === '>') break;

            if (Char.isWhiteSpace(ch)) {
                if (tagName)
                    break;
                else
                    throw er.invalidHtmlTag(tag);
            }

            tagName += ch;
        }
        return tagName;
    }

    ////////////////
    //   EXPORTS  //
    ////////////////
    var compile = (args, done) => new Parser(args).compile(done);
    var compileSync = args => new Parser(args).compileSync();

    // Module/Exports..
    return {
        compile,
        compileSync
    };

}; // module.export


