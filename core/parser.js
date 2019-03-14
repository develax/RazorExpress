'use strict';
require('./utils');

function compilePageSync(html, model, viewData, scope, isDebugMode) {
    let vm = html._vm;

    if (vm) {
        let sandbox = html._sandbox;
        // Creates cope variables.
        if (scope) {
            Object.keys(scope).forEach((k) => {
                defineConstant(sandbox, k, scope[k]);
            });
        }

        defineConstant(sandbox, "Html", html);
        defineConstant(sandbox, "Model", model);
        defineConstant(sandbox, "ViewData", viewData);
        defineConstant(sandbox, "debug", isDebugMode);
        vm.runInNewContext(html._js, sandbox);
    }
    else {
        const argNames = ["Html", "Model", "ViewData", "debug"];
        const argValues = [html, model, viewData, isDebugMode];

        if (scope) {
            // Add cope variables (we should but can't make them constants because of `eval` limitation in sctict-mode).
            Object.keys(scope).forEach((k) => {
                argNames.push(k);
                argValues.push(scope[k]);
            });
        }

        // Put the JS-scipt to be executed.
        argNames.push(html._js);
        // Execute JS-script via function with arguments.
        Function.apply(undefined, argNames).apply(undefined, argValues);
    }

    function defineConstant(obj, name, value) {
        Object.defineProperty(obj, name, {
            value,
            writable: false
        });
    }
}

function compilePage(html, model, viewData, scope, isDebugMode, done) {
    try {
        compilePageSync(html, model, viewData, scope, isDebugMode);
        return html.__renderLayout(done);
    }
    catch (exc) {
        done(exc);
    }
}

module.exports = function (opts) {
    opts = opts || {};
    const dbg = require('../core/dbg/debugger');
    const debugMode = dbg.isDebugMode;
    const isBrowser = dbg.isBrowser;
    const log = opts.log || { debug: () => { } };
    log.debug(`Parser debug mode is '${!!debugMode}'.`);

    const HtmlString = require('./HtmlString');
    const htmlEncode = require('./libs/js-htmlencode');

    ////////////////////
    ///   Html class
    ////////////////////
    function Html(args) {
        this._vm = null;

        if (debugMode && !isBrowser) {
            this._vm = require('vm');
            this._sandbox = Object.create(null);
            this._vm.createContext(this._sandbox);
        }

        // function (process,...){...}() prevents [this] to exist for the 'vm.runInNewContext()' method
        this._js = `
        'use strict';
(function (process, window, global, module, require, compilePage, compilePageSync, navigator, undefined) {
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
                    scope: args.scope,
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
            if (!isVisibleValue(val)) // 'undefined' can be passed when `Html.raw()` is used by user in the view, in this case it will be wrapped into `Html.ecnode()` anyway an it will call `Html.raw` passing 'undefined' to it.
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
            if (!isVisibleValue(val))
                return '';

            if (typeof val === "number" || val instanceof Number || val instanceof HtmlString)
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
                scope: args.scope,
                model: viewModel === undefined ? args.model : viewModel, // if is not set explicitly, set default (parent) model
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

    function isVisibleValue(val) {
        return (val != null && val !== '');
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

            compilePage(htmlObj, this.args.model, this.args.viewData, this.args.scope, debugMode, (err, html) => {
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
                compilePageSync(html, this.args.model, this.args.viewData, this.args.scope, debugMode);
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

            // extract scope..
            var model = this.args.model;

            if (model && model.$) {
                this.args.scope = model.$;
                delete model.$;
            }

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

                if (waitOperator && ch !== '<' && ch !== '}' && ch !== operatorExpectScope) {
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
                                if (/*!wait && */(operatorName !== "if" || ch === firstScope)) {
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
                                    if (!wait) {
                                        waitAcc = '';
                                        stop = !(waitOperator || operatorName);
                                        skipCh = (ch === '}') && !hasOperator;// skip the outer {} of the code-block
                                    }
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
                        else if (ch === '@'/* && (!lastLiteral || Char.isWhiteSpace(lastLiteral))*/) {
                            throw this.er.unexpectedAtCharacter(this.lineNum, this.linePos(), this.line); // [Invalid-HTML 9], [Section 1]
                        }
                        else if (ch === '<') {
                            // ':' for `switch/case:`
                            if (['', '{', '}', ';', ':'].some((c) => c === lastLiteral)) {
                                this.stepBack(blocks, 0);
                                this.parseHtmlInsideCode(blocks);
                                block = this.newBlock(blockType.code, blocks);
                                waitOperator = null;
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

        if (!err.isRazorError || (err.__dbg && err.__dbg.viewName !== (err.data && err.data.filename)))
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
