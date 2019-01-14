'use strict';

window.raz = {
    set debug(value) {
        require('../core/dbg/debugger').isDebugMode = value;
    },
    get debug(){
        return require('../core/dbg/debugger').isDebugMode;
    },
    render(template, model) {
        if (!this.parser)
            this.parser = require('./parser')();

        return this.parser.compileSync(template, model);
    }
}