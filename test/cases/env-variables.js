(function () {
    var cases = [
        {
            name: "case 1 - `debug` constant must exist",
            template: '<span>@debug</span>',
            expected: '<span>false</span>'
        },
        {
            name: "case 1.1 - `debug` variable must be `constant`",
            template: '@{ debug = true; }',
            error: 'constant'
        },
        {
            name: "case 2 - `Html` constant must exist",
            template: '<span>@Html</span>',
            expected: '<span>[object Object]</span>'
        },
        {
            name: "case 2.1 - `Html` variable must be `constant`",
            template: '@{ Html = {}; }',
            error: 'constant'
        },
        {
            name: "case 3 - `Model` constant must exist",
            model: {},
            template: '<span>@Model</span>',
            expected: '<span>[object Object]</span>'
        },
        {
            name: "case 3.1 - `Model` variable must be `constant`",
            model: {},
            template: '@{ Model = {}; }',
            error: 'constant'
        },
        {
            name: "case 4 - `ViewData` constant must exist",
            template: '<span>@ViewData</span>',
            expected: '<span>[object Object]</span>'
        },
        {
            name: "case 4.1 - `ViewData` variable must be `constant`",
            template: '@{ ViewData = {}; }',
            error: 'constant'
        },
        {
            name: "case 5 - `this` should be `undefined`",
            template: '<span>@this</span>',
            expected: '<span></span>'
        },
        {
            name: "case 6 - `Html._js` should be `undefined`",
            template: '<span>@Html._js</span>',
            expected: '<span></span>'
        },
        {
            name: "case 7 - `Html._vm` should be `undefined`",
            template: '<span>@Html._vm</span>',
            expected: '<span></span>'
        },
        {
            name: "case 8 - `Html._sandbox` should be `undefined`",
            template: '<span>@Html._sandbox</span>',
            expected: '<span></span>'
        },
        {
            name: "case 9 - `global` object should be `undefined`",
            template: '<span>@global</span>',
            expected: '<span></span>'
        },
        {
            name: "case 10 - `window` object should be `undefined`",
            template: '<span>@window</span>',
            expected: '<span></span>'
        },
        {
            name: "case 11 - `module` object should be `undefined`",
            template: '<span>@module</span>',
            expected: '<span></span>'
        },
        {
            name: "case 12 - `compilePage` object should be `undefined`",
            template: '<span>@compilePage</span>',
            expected: '<span></span>'
        },
        {
            name: "case 13 - `compilePageSync` object should be `undefined`",
            template: '<span>@compilePageSync</span>',
            expected: '<span></span>'
        },
        {
            name: "case 14 - `Html._jshtml` should be `undefined`",
            template: '<span>@Html._jshtml</span>',
            expected: '<span></span>'
        }
    ];
    module.exports = cases;
})();
