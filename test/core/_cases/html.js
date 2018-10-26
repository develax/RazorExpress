(function () {
    var cases = [
        {
            name: "HTML 1",
            template: '<img title="fun" />',
            expected: '<img title="fun" />'
        },
        {
            name: "HTML 2",
            template: '<span></span>',
            expected: '<span></span>'
        },
        {
            name: "HTML 3",
            template: '<span><img title="fun" /></span>',
            expected: '<span><img title="fun" /></span>'
        },
        {
            name: "HTML 4",
            template: '<span>/\some text</span>',
            expected: '<span>/\some text</span>'
        },
        {
            name: "HTML 5",
            template: '<span > /\ some text </span >',
            expected: '<span > /\ some text </span >'
        },
        {
            name: "HTML 6",
            template: '<span title="hello">/\\ some text</span>',
            expected: '<span title="hello">/\\ some text</span>'
        },
        {
            name: "HTML 7",
            template: '<span title="hello">/\\ some text</span>',
            expected: '<span title="hello">/\\ some text</span>'
        },
        {
            name: "HTML 8",
            template: `
<span title="hello">
    <span>
        some text
    </span>
</span>`,
            expected: `
<span title="hello">
    <span>
        some text
    </span>
</span>`
        },
        {
            name: "HTML 9",
            template: `
<span title="hello">
    <img />
    some text
    <span>
        some text
    </span>
</span>`,
            expected: `
<span title="hello">
    <img />
    some text
    <span>
        some text
    </span>
</span>`
        },
        {
            name: "HTML 10",
            template: '<span>@@</span>',
            expected: '<span>@</span>'
        },
        {
            name: "HTML 11",
            template: '<span>><</span>',
            expected: '<span>><</span>'
        },
        {
            name: "HTML 12",
            template: '<span><></span>',
            expected: '<span><></span>'
        },
        {
            name: "HTML 13",
            template: '<span></</span>',
            expected: '<span></</span>'
        },
        {
            name: "HTML 14",
            template: '<span></></span>',
            expected: '<span></></span>'
        },
        {
            name: "HTML 15",
            template: '<span>text<//</span>',
            expected: '<span>text<//</span>'
        },
        {
            name: "HTML 16",
            template: '<span >text</span >',
            expected: '<span >text</span >'
        },
        {
            name: "HTML 17",
            template: '<div>< span></div>',
            expected: '<div>< span></div>'
        },
        {
            name: "HTML 18",
            template: '<div></ div></div>',
            expected: '<div></ div></div>'
        },
        {
            name: "HTML 19",
            template: '<div>< span> *TEXT* </ span></div>',
            expected: '<div>< span> *TEXT* </ span></div>'
        },
        {
            name: "HTML 20",
            template: '<a title="<>">text</a>',
            expected: '<a title="<>">text</a>'
        },
        {
            name: "HTML 21",
            template: '<a title="<>">text</a>',
            expected: '<a title="<>">text</a>'
        },
        {
            name: "HTML 22",
            template: `<div><//div></div>`,
            expected: "<div><//div></div>"
        },
        {
            name: "HTML 23",
            template: `
@{
    <div><//div></div>
}`,
            expected: "\n    <div><//div></div>\n"
        },
        {
            name: "HTML 24",
            template: `<div><img//></div>`,
            expected: "<div><img//></div>"
        },
        {
            name: "HTML 25",
            template: `
@{
    <div><img//></div>
}`,
            expected: "\n    <div><img//></div>\n"
        }
    ];

    module.exports = cases;
})();
