(function () {
    module.exports = function (opts) {
        opts = opts || {};
        var exp = {};

        if (opts.on) {
            exp.debug = debug;
        }
        else {
            exp.debug = noop;
        }

        return exp;

        function debug(text) {
            let funcName = callerName();
            text = text || '';
            console.debug(`[${funcName}]: ${text}`);
        }

        function noop() {}
    };

    // helpers:
    function callerName() {
        try {
            throw new Error();
        }
        catch (e) {
            try {
                return e.stack.split('at ')[3].split(' ')[0];
            } catch (e) {
                return '';
            }
        }
    }
})();