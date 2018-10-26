(function () {
    module.exports = function (opts) {
        opts = opts || {};

        return {
            debug: (text) => {
                if (opts.off) return;
                let funcName = callerName();
                text = text || '';
                console.debug(`[${funcName}]: ${text}`);
            }
        };
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