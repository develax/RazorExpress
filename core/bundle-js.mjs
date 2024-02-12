'use strict';
import { setDebugMode, isDebugMode } from './dbg/debugger.mjs';
window.raz = {
    set debug(value) {
        setDebugMode(value);
    },
    get debug(){
        return isDebugMode;
    },
    render(template, model) {
        if (!this.parser)
            this.parser = require('./parser')();

        return this.parser.compileSync(template, model);
    }
}