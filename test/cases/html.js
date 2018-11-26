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
            name: "HTML 5.1",
            template: '<span > \/ some text </span >',
            expected: '<span > \/ some text </span >'
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
        },
        {
            name: "HTML 26",
            template: '<div><!--<img/>--></div>',
            expected: '<div><!--<img/>--></div>'
        },
        {
            name: "HTML 27",
            template: '<div><!--<span>--></div>',
            expected: '<div><!--<span>--></div>'
        },
        {
            name: "HTML 28",
            template: '<!--<span>-->',
            expected: '<!--<span>-->'
        },
        {
            name: "HTML 28.1",
            template: `
<!--test-->
@{
    var x = "123";
}
<div>
    <span>@x</span>
    <a href="/"><<-- back</a>
</div>`,
            expected: `
<!--test-->
<div>
    <span>123</span>
    <a href="/"><<-- back</a>
</div>`
        },
        {
            name: "HTML 28.2",
            template: `
<!-- d-l -->
<div>
    <a href="/"><<-- back</a>
</div>`,
            expected: `
<!-- d-l -->
<div>
    <a href="/"><<-- back</a>
</div>`
        },
        {
            name: "HTML 28.3",
            template: `
@{
<!-- d-l -->
<div>
    <a href="/"><<-- back</a>
</div>
}`,
            expected: `
<!-- d-l -->
<div>
    <a href="/"><<-- back</a>
</div>
`
        },
        {
            name: "HTML 29",
            template: `
<script type="text/javascript">
    var longText = "..your long text...";
    document.querySelector('#set_text').onclick = e => load('');
    var chunkSize = 100000;
    var start = -chunkSize;
    function load(text) {
        var node = document.createTextNode(text);
        document.querySelector('pre').appendChild(node);

        if (start + chunkSize >= longText.length) {
            alert("Completed");
            return;
        }

        start += chunkSize;
        chunkSize = Math.min(chunkSize, longText.length - start);
        setTimeout(load, 0, longText.substr(start, chunkSize));
    }
</script>`,
            expected: `
<script type="text/javascript">
    var longText = "..your long text...";
    document.querySelector('#set_text').onclick = e => load('');
    var chunkSize = 100000;
    var start = -chunkSize;
    function load(text) {
        var node = document.createTextNode(text);
        document.querySelector('pre').appendChild(node);

        if (start + chunkSize >= longText.length) {
            alert("Completed");
            return;
        }

        start += chunkSize;
        chunkSize = Math.min(chunkSize, longText.length - start);
        setTimeout(load, 0, longText.substr(start, chunkSize));
    }
</script>`
        },
        {
            name: "HTML 30",
            template: '<span><img></span>',
            expected: '<span><img></span>'
        }
    ];

    module.exports = cases;
})();
