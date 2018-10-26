(function () {
    var cases = [
        {
            name: "case 1 - `this` should be `undefined`",
            template: '<span>@this</span>',
            expected: '<span>undefined</span>'
        },
        {
            name: "case 2 - `Html._js` should be `undefined`",
            template: '<span>@Html._js</span>',
            expected: '<span>undefined</span>'
        },
        {
            name: "case 3 - `global` object should be `undefined`",
            template: '<span>@global</span>',
            expected: '<span>undefined</span>'
        },
        {
            name: "case 4 - `window` object should be `undefined`",
            template: '<span>@window</span>',
            expected: '<span>undefined</span>'
        },
        {
            name: "case 5 - `module` object should be `undefined`",
            template: '<span>@module</span>',
            expected: '<span>undefined</span>'
        },
        {
            name: "case 6 - `compilePage` object should be `undefined`",
            template: '<span>@compilePage</span>',
            expected: '<span>undefined</span>'
        },
        {
            name: "case 7 - `compilePageSync` object should be `undefined`",
            template: '<span>@compilePageSync</span>',
            expected: '<span>undefined</span>'
        }
        ,
        {
            name: "case 8 - `code` object should be `undefined`",
            template: '<span>@code</span>',
            expected: '<span>undefined</span>'
        }
    ];
    module.exports = cases;
})();
