(function () {
    var cases = [
        {
            name: "Model 1",
            template: '<span>@(Model)</span>',
            expected: '<span>Hello World!</span>',
            model: "Hello World!"
        },
        {
            name: "Model 2",
            template: '<span>@Model</span>',
            expected: '<span>Hello World!</span>',
            model: "Hello World!"
        },
        {
            name: "Model 3",
            template: '<span>@Model.text</span>',
            expected: '<span>Hello World!</span>',
            model: { text: "Hello World!" }
        },
        {
            name: "Model 4",
            template: '<span>@("Hello World!")</span>',
            expected: '<span>Hello World!</span>'
        },
        {
            name: "Model 5",
            template: '<span>@("\'Hello World!\'")</span>',
            expected: "<span>'Hello World!'</span>"
        },
        {
            name: "Model 6",
            template: '<span>@("\'(<div>@</div>)\'")</span>',
            expected: "<span>'(<div>@</div>)'</span>"
        },
        {
            name: "Model 7",
            template: '<span>@[1, 2, 3]</span>',
            expected: "<span>1,2,3</span>"
        },
        {
            name: "Model 8",
            template: '<span>@Model.mass[1]</span>',
            expected: '<span>2</span>',
            model: { mass: [1, 2, 3] }
        },
        {
            name: "Model 9",
            template: '<span>@Model.val)</span>',
            expected: '<span>3)</span>',
            model: { val: 3 }
        },
        {
            name: "Model 10",
            template: "<span>@(['a', 'b', 'c'].indexOf('c'))</span>",
            expected: "<span>2</span>"
        },
        {
            name: "Model 11",
            template: "<span>@['a', 'b', 'c'].indexOf('c')</span>",
            expected: "<span>2</span>"
        },
        {
            name: "Model 12",
            template: "<span>@Model</span>",
            expected: "<span>undefined</span>"
        },
        {
            name: "Model 13",
            template: '<span>@Model.val</span>',
            expected: "<span>undefined</span>",
            model: {  }
        },
        {
            name: "Model 14",
            template: '<span>@[Model.val]</span>',
            expected: "<span>3</span>",
            model: { val: 3 }
        },
        {
            name: "Model 15",
            template: '<a title="<@Model>">text</a>',
            expected: '<a title="<123>">text</a>',
            model: 123
        },
        {
            name: "Model 16",
            template: '<a title="@Model">text</a>',
            expected: '<a title="123">text</a>',
            model: 123
        },
        {
            name: "Model 16.1",
            template: `<a title="'@Model'">text</a>`,
            expected: '<a title="\'123\'">text</a>',
            model: 123
        },
        {
            name: "Model 16.2",
            template: '<a title="val=@Model">text</a>',
            expected: '<a title="val=123">text</a>',
            model: 123
        },
        {
            name: "Model 17",
            template: '<span>@[1, 2, 3, 5, "Hello World!"]</span>',
            expected: '<span>1,2,3,5,Hello World!</span>'
        },
        {
            name: "Model 18",
            template: '<@Model.tag>The dynamic tag test.</@Model.tag>',
            expected: '<div>The dynamic tag test.</div>',
            model: { tag: "div" }
        },
        {
            name: "Model 19",
            template: '<span>@((function(x, y){ return x + y; })(3, 2))</span>',
            expected: "<span>5</span>"
        },
        {
            name: "Model 20",
            template: '<span>@(((x, y) => x + y)(3, 2))</span>',
            expected: "<span>5</span>"
        },
    ];
    module.exports = cases;
})();
