'use strict';
import { setDebugMode, isDebugMode } from './dbg/debugger.mjs';
import * as p from "./parser.mjs"
window.raz = {
    set debug(value) {
        setDebugMode(value);
    },
    get debug(){
        return isDebugMode;
    },
    render(template, model) {
        if (!this.parser)
            this.parser = p.default();

        return this.parser.compileSync(template, model);
    }
}