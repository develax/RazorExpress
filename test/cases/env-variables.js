(function () {
    var cases = [
        {
            name: "case 1 - `this` should be `undefined`",
            template: '<span>@this</span>',
            expected: '<span></span>'
        },
        {
            name: "case 2 - `Html._js` should be `undefined`",
            template: '<span>@Html._js</span>',
            expected: '<span></span>'
        },
        {
            name: "case 3 - `Html._vm` should be `undefined`",
            template: '<span>@Html._vm</span>',
            expected: '<span></span>'
        },
        {
            name: "case 4 - `Html._sandbox` should be `undefined`",
            template: '<span>@Html._sandbox</span>',
            expected: '<span></span>'
        },
        {
            name: "case 5 - `global` object should be `undefined`",
            template: '<span>@global</span>',
            expected: '<span></span>'
        },
        {
            name: "case 6 - `window` object should be `undefined`",
            template: '<span>@window</span>',
            expected: '<span></span>'
        },
        {
            name: "case 7 - `module` object should be `undefined`",
            template: '<span>@module</span>',
            expected: '<span></span>'
        },
        {
            name: "case 8 - `compilePage` object should be `undefined`",
            template: '<span>@compilePage</span>',
            expected: '<span></span>'
        },
        {
            name: "case 9 - `compilePageSync` object should be `undefined`",
            template: '<span>@compilePageSync</span>',
            expected: '<span></span>'
        },
        {
            name: "case 10 - `Html._jshtml` should be `undefined`",
            template: '<span>@Html._jshtml</span>',
            expected: '<span></span>'
        }
    ];
    module.exports = cases;
})();
