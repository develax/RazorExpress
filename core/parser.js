'use strict';

(function () {
    require('./utils');

    function compilePageSync(Html, Model, debug) {
            //console.log("DEBUG = " + debug);
            'use strict';

            // function (process,...){...}() prevents [this] to exist for the 'vm.runInNewContext()' method
            var code = `
(function (process, window, global, module, compilePage, compilePageSync, code, undefined) { 
    'use strict';
    delete Html._js;
    delete Html._vm;
    delete Html._sandbox;
    ${Html._js}
}).call();`;

            if (debug) {
                let sandbox = Html._sandbox;
                let vm = Html._vm;
                sandbox.Html = Html;
                sandbox.Model = Model;
                //sandbox.process = process;
                //sandbox.window = window;
                //sandbox.global = global;
                //sandbox.module = module;
                //sandbox.compilePage = compilePage;
                //sandbox.compilePageSync = compilePageSync;
                //sandbox.debug = debug;
                //sandbox.undefined = undefined;
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

    function compilePage(Html, Model, done) {
        try {
            (function (process, window, global, module, compilePage, compilePageSync, done, undefined) {
                'use strict';
                try {
                    eval(`
'use strict';
delete Html._js;
${Html._js}`
                    );
                }
                catch (exc) {
                    throw exc;
                }
            }).call();
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
            this._js = args.js;

            this.__rnd = function (val) { // render
                args.html += val;
            };


            this.__val = function (i) { // getValueAt
                return args.valuesQueue.getAt(i);
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
                        findPartial,
                        findPartialSync: args.findPartialSync
                    };
                    compile(compileOpt, done);
                });
            };

            // User section.
            this.layout = null;

            this.body = function () {
                return args.bodyHtml;
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
            constructor(type) {
                this.type = type;
                this.text = '';
            }

            append(ch) {
                this.text += ch;
                //this.text += (ch === '"') ? '\\"' : ch;
            }

            toScript(valuesQueue) {
                return toScript(this.text, this.type, valuesQueue);
            }
        }

        function toScript(text, blockType, valuesQueue) {
            let i;
            switch (blockType) {
                case type.html:
                    i = valuesQueue.enq(text);
                    return "Html.__rnd(Html.__val(" + i + "));";
                case type.expr:
                    i = valuesQueue.enq(text);
                    return "Html.__rnd(eval(Html.__val(" + i + ")));";
                case type.code:
                    return text;
                default:
                    throw `Unexpected block type = "${blockType}".`;
            }
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
        const type = { none: 0, html: 1, code: 2, expr: 3 };
        const er = require('./localization/errors').parser;

        return {
            compile,
            compileHtml: (jshtml, model) => compileSync({ jshtml, model })
        };

        var _text;
        var _line, _lineNum, _pos, _padding;
        var _blocks, _sections;

        // --- Methods --- 
        function compile(args, done) {
            log.debug();
            // checking arguments..
            let jshtml = args.jsHtml;
            let model = args.model;
            var isString = Object.prototype.toString.call(jshtml) === "[object String]";
            if (!isString) return Promise.resolve().then(() => done(er.jshtmlShouldBeString)), null;
            if (!jshtml.length) return Promise.resolve().then(() => done(null, "")), null; // just an empty string.. nothing to do..

            //////////////////////////////////////
            // parsing.. 

            _text = jshtml, _line = '', _lineNum = 0, _pos = 0, _padding = '';
            _sections = _blocks = [];
            parseHtml(_blocks);
            var valuesQueue = new Queue();
            var js = _blocks.map((b) => toScript(b.text, b.type, valuesQueue)).join("");
            var htmlArgs = {
                html: '',
                valuesQueue,
                js,
                model,
                bodyHtml: args.bodyHtml,
                findPartial: args.findPartial,
                findPartialSync: args.findPartialSync
            };
            var html = new Html(htmlArgs);
            compilePage(html, model, done);
        }

        function compileSync(args) {
            log.debug();
            let jshtml = args.jshtml;
            let model = args.model;
            // checking arguments..
            var isString = Object.prototype.toString.call(jshtml) === "[object String]";
            if (!isString) throw er.jshtmlShouldBeString;
            if (!jshtml.length) return jshtml; // just an empty string.. nothing to do..
            //////////////////////////////////////
            // parsing.. 
            _text = jshtml, _line = '', _lineNum = 0, _pos = 0, _padding = '';
            _sections = _blocks = [];
            parseHtml(_blocks);
            var valuesQueue = new Queue();
            var js = _blocks.map((b) => toScript(b.text, b.type, valuesQueue)).join("");
            log.debug("script: \n" + js);
            var htmlArgs = {
                html: '',
                valuesQueue,
                js,
                findPartialSync: args.findPartialSync,
                model
            };
            var html = new Html(htmlArgs);
            deleteProperties({ test: 1 });
            compilePageSync(html, model, opts.debug);
            return htmlArgs.html;
        }

        function deleteProperties(obj) {
                for (var p in obj)
                    if (Object.prototype.hasOwnProperty.call(obj, p))
                        delete obj[p];
        }

        function parseHtml(blocks, outerWaitTag) {
            log.debug(`[START] blocks = ${blocks.length}.`);
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

            for (var ch = fetchChar(); ch; ch = fetchChar()) {
                let isSpace = String.isWhiteSpace(ch);
                let nextCh = pickChar();
                let inQuotes = (quotes.length > 0);

                if (ch === '@') {
                    if (nextCh === '@') { // checking for '@@' that means just text '@'
                        ch = fetchChar(); // skip the next '@'
                        nextCh = pickChar();
                    }
                    else {
                        parseCode(blocks);
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
                                        throw er.missingMatchingStartTag(tag, _lineNum, linePos() - tag.length, _line); // tested by "Invalid-HTML 1+, 2+, 7"
                                    // else they are neitralizing each other..
                                }
                                else if (outerWaitTag && outerWaitTag === tagName) {
                                    stepBack(tag.length);
                                    break;
                                }
                                else {
                                    throw er.missingMatchingStartTag(tag, _lineNum, linePos() - tag.length, _line); // tested by "Invalid-HTML 4"
                                }
                            }
                            else if (tagKind === tagKinds.open) {
                                openTags.push({ tag: tag, name: tagName, lineNum: _lineNum, linePos: linePos() - tag.length, line: _line });
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
                    stepBack();
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
                        flushPadding();
                        block.append(ch);
                    }
                    else { // it's a true- space or tab
                        if (lineLastLiteral) // it's not the beginning of the current line
                            block.append(ch);
                        else // it is the beginning of the  line
                            _padding += ch; // we still don't know whether this line is going to be a code or HTML
                    }
                }
                else {
                    flushPadding();
                    block.append(ch);
                    lastLiteral = lineLastLiteral = ch;
                }

                lastCh = ch;
            }

            if (openTags.length) {
                let openTag = openTags[openTags.length - 1];
                throw er.missingMatchingEndTag(openTag.tag, openTag.lineNum, openTag.linePos, openTag.line); // tested by "Invalid-HTML 3"
            }

            if (!stop)
                flushPadding();

            log.debug(`[END] blocks = ${blocks.length}.`);
        }

        function parseHtmlInsideCode(blocks) {
            log.debug(`[START] blocks = ${blocks.length}.`);
            const docTypeName = "!DOCTYPE";
            const textQuotes = '\'"';
            var quotes = [];
            var tag = '', openTag = '', openTagName = '', lineLastLiteral = '';
            let openTagLineNum, openTagPos, openTagLine;
            var block = newBlock(type.html, blocks);
            var lastCh = '';
            let stop = false;

            for (var ch = fetchChar(); !stop && ch; ch = ch && fetchChar()) {
                var nextCh = pickChar();
                let isSpace = String.isWhiteSpace(ch);

                if (ch === '@') {
                    if (String.isWhiteSpace(block.text)) {
                        // In contrast to a base-HTML-block, here it can only start with an HTML-tag.
                        throw er.unexpectedCharacter(ch, _lineNum, _line.length, _line); // cannot be tested, just for insurance
                    }
                    if (pickChar() === '@') { // checking for '@@' that means just text '@'
                        ch = fetchChar(); // skip the next '@'
                    }
                    else {
                        parseCode(blocks);

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
                        throw er.unexpectedCharacter(ch, _lineNum, _line.length - 1, _line); // tested by "Invalid-HTML 8"

                    if (openTagName) { // it should be a close-tag or another nested html-block
                        if (nextCh !== '/') {
                            // it should be the next nested block of HTML which should be parsed with the normal `parseHtml` method.
                            stepBack(); // step back before `<` literal
                            parseHtml(blocks, openTagName);
                            block = newBlock(type.html, blocks);
                            tag = lastCh = lineLastLiteral = '';
                            continue;
                        }
                    }
                    // ELSE it must be the begining an open-tag or a self-close, however it will be a new one on the same deep-level
                    if (ch)
                        tag = ch;
                }
                else if (ch === '/') {
                    // So, it must be..
                    if (tag) {
                        if (nextCh === '/') { // it can be only considered as html, only as a text-fragment, so parse it as the next level of html..
                            // '<//' or '<a //>', smarter than MS-RAZOR :)
                            stepBack(tag.length + 1);
                            parseHtml(blocks, openTagName);
                            block = newBlock(type.html, blocks);
                            tag = lastCh = lineLastLiteral = '';
                            continue;
                        }
                            
                        // closing- or self-closing tag ..
                        if (tag === '<' || tag.length > 1) { // '<' or `<a` at least
                            tag += ch;
                        }
                        else {
                            throw er.unexpectedCharacter(ch, _lineNum, _line.length - 1, _line); // ???
                        }
                    }
                    else {
                        throw er.unexpectedCharacter(ch, _lineNum, _pos, _line);
                    }
                }
                else if (ch === '>') {
                    if (tag) {
                        tag += ch;

                        if (openTagName) {
                            if (tag.length > 2) { // it's a close-tag, at least `</a`
                                let tagName = getTagName(tag);

                                if (openTagName.toUpperCase() !== tagName.toUpperCase())
                                    throw er.missingMatchingStartTag(tag, _lineNum, linePos() - tag.length, _line);

                                openTag = openTagName = ''; // open-tag is closed
                            }
                        }
                        else {
                            if (tag[tag.length - 1] === '/') { // it's a self-close tag..
                                // nothing to do
                            }
                            else if (tag.length > 1) { // it's an open-tag, at least `<a`
                                let tagName = getTagName(tag);

                                if (tag[1] === '/') // it's a close-tag, unexpected..
                                    throw er.missingMatchingStartTag(tag, _lineNum, linePos() - tag.length, _line); // tested by "Invalid-HTML 5"

                                openTag = tag;
                                openTagName = tagName;
                                openTagPos = linePos() - tag.length;
                                openTagLineNum = _lineNum;
                                openTagLine = _line;
                            }
                            else
                                throw er.unexpectedCharacter(ch, _lineNum, _pos, _line);
                        }

                        tag = ''; //  reset it & go on..
                    }
                    else {
                        throw er.unexpectedCharacter(ch, _lineNum, _pos, _line);
                    }
                }
                else if (isSpace) {
                    if (tag) { // within a tag
                        if (lastCh === '<' || lastCh === '/') // '<' or '</' or '<tag/'
                            throw er.unexpectedCharacter(ch, _lineNum, linePos(), _line);
                        else
                            tag += ch;
                    }
                }
                else { // any other character
                    if (tag)
                        tag += ch;
                    else if (openTagName) {
                        // do nothing
                    }
                    else {
                        // it should be returned back to code-block
                        stepBack(); // step back before `<` literal
                        ch = '';
                        stop = true;
                    }
                }

                if (ch) {
                    if (isSpace) {
                        if (ch === '\n') {
                            lineLastLiteral = '';
                            flushPadding();// flash padding buffer in case this whole line contains only whitespaces ..
                            block.append(ch);
                        }
                        else { // it's a true- space or tab
                            if (lineLastLiteral) // it's not the beginning of the current line
                                block.append(ch);
                            else // it is the beginning of the  line
                                _padding += ch; // we still don't know whether this line is going to be a code or HTML
                        }
                    }
                    else {
                        flushPadding();
                        block.append(ch);
                        lineLastLiteral = ch;
                    }

                    lastCh = ch[ch.length - 1];
                }
            }

            if (openTagName)
                throw er.missingMatchingEndTag(openTag, openTagLineNum, openTagPos, openTagLine); // tested by "Invalid-HTML 6"

            if (!stop)
                flushPadding();

            log.debug(`[END] blocks = ${blocks.length}.`);
        }

        function parseCode(blocks) {
            var ch = pickChar();
            if (!ch) throw er.endOfFileFoundAfterAtSign; // TODO: test me.

            if (ch === '{') {
                parseJsBlock(blocks);
            }
            else if (isSection()) {
                parseSection();
            }
            else if (canExpressionStartWith(ch)) {
                parseJsExpression(blocks);
            }
            else {
                throw er.notValidStartOfCodeBlock(ch, _lineNum, _pos);
            }
        }

        function parseJsExpression(blocks) {
            log.debug(`[START] blocks = ${blocks.length}.`);
            const startScopes = '([';
            const endScopes = ')]';
            const textQuotes = '\'"`';
            var lastCh = '';
            var waits = [];
            var wait = null;
            var firstScope = null;
            flushPadding();// there is no sense to put padding to the expression text since it will be lost while evaluating
            let block = newBlock(type.expr, blocks);
            block.text = _padding;
            _padding = '';
            var stop = false, checkForBlockCode = false;
            let scopeCollapsed;
            let inText = false;

            for (var ch = pickChar(); !stop && ch; ch = pickChar()) { // pick or fetch ??
                if (checkForBlockCode) {
                    if (String.isWhiteSpace(ch)) {
                        _padding += ch;
                    }
                    else if (ch === '{') {
                        flushPadding();
                        block.type = type.code;
                        return parseJsBlock(blocks, block);
                    }
                    else {
                        stop = true;
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
                                throw er.invalidExpressionChar(ch, _lineNum, _pos, _line);
                            }
                        }
                        else if (textQuotes.indexOf(ch) !== -1) { // it's some sort of text qoutes
                            wait && waits.push(wait);
                            wait = ch;
                            inText = true; // put on waits-stack
                        }
                    }
                    else if (block.text && !canExpressionEndWith(ch)) {
                        if (ch === '.') { // @Model.text
                            let nextCh = pickNextChar();
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
                fetchChar();
            }

            if (wait)
                throw er.expressionMissingEnd('@' + block.text, wait, _lineNum, _pos);

            if (!block.text)
                throw er.invalidExpressionChar(ch, _lineNum, _pos, _line);

            log.debug(`[END] blocks = ${blocks.length}.`);
        }

        function parseJsBlock(blocks, block) {
            log.debug(`[START] blocks = ${blocks.length}.`);
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

            for (var ch = pickChar(); !stop && ch; ch = pickChar()) { // pick or fetch ??
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
                                throw er.invalidExpressionChar(ch, _lineNum, _pos, _line);
                            }
                        }
                        else if (textQuotes.indexOf(ch) !== -1) { // it's some sort of text qoutes
                            wait && waits.push(wait);
                            wait = ch;
                            inText = true; // put on waits-stack
                        }
                        else if (ch === '<') {
                            if (lastLiteral === '' || lastLiteral === '{' || lastLiteral === ';') {
                                parseHtmlInsideCode(blocks);
                                block = newBlock(type.code, blocks);
                                continue;
                            }
                        }
                    }
                }

                if (skipCh) {
                    _padding = '';
                }
                else {
                    let isSpace = String.isWhiteSpace(ch);

                    if (isSpace) {
                        if (ch === '\n') {
                            lineLastLiteral = '';
                            flushPadding(); // flash padding buffer in case this whole line contains only whitespaces ..
                            block.append(ch);
                        }
                        else { // it's a true- space or tab
                            if (lineLastLiteral) // it's not the beginning of the current line
                                block.append(ch);
                            else // it is the beginning of the  line
                                _padding += ch; // we still don't know whether this line is going to be a code or HTML
                        }
                    }
                    else {
                        flushPadding();
                        block.append(ch);
                        lastLiteral = lineLastLiteral = ch;
                    }

                    lastCh = ch;
                }

                fetchChar();
            }

            if (wait)
                throw er.jsCodeBlockkMissingClosingChar(_lineNum, _pos, '@' + block.text);

            if (stop) {
                // skip all spaces until a new line
                while (String.isWhiteSpace(pickChar())) {
                    ch = fetchChar();
                    if (ch === '\n') break; // a `\n` the last to skip
                }
            }
            else {
                flushPadding();
            }

            log.debug(`[END] blocks = ${blocks.length}.`);
        }

        function parseSection() {
            _pos += _sectionKeyword.length;
            let spaceCount = 0;

            for (var ch = pickChar(); ch && String.isWhiteSpace(ch); ch = pickChar()) {
                fetchChar();
                spaceCount++;
            }

            if (spaceCount < 1) throw er.whitespaceExpectedAfter("@" + _sectionKeyword, _lineNum, _pos);

            let sectionName = '';

            for (ch = pickChar(); ch && !String.isWhiteSpace(ch) && ch !== '{'; ch = pickChar())
                sectionName += fetchChar();

            if (sectionName.length === 0)
                throw er.sectionNameExpectedAfter("@" + _sectionKeyword, _lineNum, _pos);

            if (!canSectionStartWith(sectionName[0]))
                throw er.sectionNameCannotStartWith(sectionName[0], _lineNum, _pos);

            for (var i = 1; i < sectionName.length; i++) {
                let c = sectionName[i];
                if (!canSectionContain(c))
                    throw er.sectionNameCannotInclude(sectionName[0], _lineNum, _pos);
            }

            ch = skipUntil(c => String.isWhiteSpace(ch));

            if (ch !== '{')
                throw er.unexpectedLiteralFollowingTheSection(ch, _lineNum, _pos);
        }

        function canSectionStartWith(ch) {
            return ch === '_' || Char.isLetter(ch);
        }

        function canSectionContain(ch) {
            return ch === '_' || Char.isLetter(ch) || Char.isDigit(ch);
        }

        //////////////////////////////////////

        function flushPadding() {
            if (!_padding) return;
            let block = _blocks[_blocks.length - 1]
            block.text += _padding;
            _padding = '';
        }

        function getTagName(tag) {
            if (!tag || tag.length < 2) throw er.invalidHtmlTag(tag);
            var tagName = '';
            for (var i = 1; i < tag.length; i++) { // skip '<' & '>'
                var ch = tag[i];

                if (ch === '/') continue; // skip '/' for '</div>'
                if (ch === '>') break;

                if (String.isWhiteSpace(ch)) {
                    if (tagName)
                        break;
                    else
                        throw er.invalidHtmlTag(tag);
                }

                tagName += ch;
            }
            return tagName;
        }

        function canExpressionStartWith(ch) {
            return ch === '_' || ch === '$' || ch === '(' || ch === '[' || Char.isLetter(ch);
        }

        function canExpressionEndWith(ch) {

            return ch === '_' || ch === '$' || Char.isLetter(ch) || Char.isDigit(ch);
        }

        function newBlock(type, blocks) {
            var block = new Block(type);
            blocks.push(block);
            return block;
        }

        function isSection() {
            return _text.startsWith(_sectionKeyword + " ", _pos);
        }

        function pickChar() {
            if (_pos < _text.length)
                return _text[_pos];

            return '';
        }

        function pickNextChar() {
            if (_pos < _text.length - 1)
                return _text[_pos + 1];

            return '';
        }

        function fetchChar() {
            if (_pos < _text.length) {
                var ch = _text[_pos++];

                if (ch === '\n')
                    _line = '',  _lineNum++;
                else
                    _line += ch;

                return ch;
            }

            return '';
        }

        function stepBack(count) {
            if (typeof count === 'undefined') count = 1;

            if (count > _line.length)
                throw `stepBack(${count}) is out of range.`;

            _pos -= count;
            let cut = _line.length - count;

            if (cut === 0)
                _line = ''; 
            else
                _line = _line.substr(0, cut);

            // adjust blocks..
            if (count > 1 && _blocks.length) {
                let block = _blocks[_blocks.length - 1];
                cut = block.text.length - count + 1; // block's text doesn't have the very last character
                if (cut === 0)
                    _blocks.pop(); // remove the current block if it's empty
                else
                    block.text = block.text.substr(0, cut);
            }
        }

        function linePos() {
            return _line.length;
        }

        function skipUntil(check) {
            let c = fetchChar();
            while (c && !check(c)) c = fetchChar();
            if (!c) throw er.unexpectedEndOfFile(_line);
            return c;
        }

        function nextNonSpace() {
            var ch;
            do {
                ch = _nextChar();
            } while (ch && ch.trim().length === 0);
            return ch;
        }

        function startsWith(str) {
            return _text.startsWithIgnoreCase(_pos, str);
        }

        function take(len) {
            let str = _text.substr(_pos, len);
            _pos += len;
            return str;
        }
    };
})();





