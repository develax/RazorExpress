(function () {
    var cases = [
        {
            name: "Code 1",
            template: `
@{
    <span></span>
}`,
            expected: "\n    <span></span>\n"
        },
        {
            name: "Code 2",
            template: `
<div>
    @{
        <span></span>
    }
</div>`,
            expected: "\n<div>\n        <span></span>\n</div>"
        },
        {
            name: "Code 3",
            template: `<div>@{<span></span>}</div>`,
            expected: "<div><span></span></div>"
        },
        {
            name: "Code 4",
            template: `
@{
    var x = (2 + 3);
}
<span>@x</span>`,
            expected: "\n<span>5</span>"
        },
        {
            name: "Code 5",
            template: `
@{
    var x = 3;
}
<span>@x</span>`,
            expected: "\n<span>3</span>"
        },
        {
            name: "Code 6",
            template: `
@{
    function test(x, y){ return x + y; }
 }  
<span>@test(2 + 5)</span>`,
            expected: "\n<span>NaN</span>"
        },
        {
            name: "Code 7",
            template: `
@{
    function test(x, y){ return x + y; }
}
<span>@test(2, 3)</span>`,
            expected: "\n<span>5</span>"
        },
        {
            name: "Code 8",
            template: `
@{
    for(var i = 0; i < 2; i++){
        <div>@i</div>
    }
}`,
            expected: "\n        <div>0</div>\n        <div>1</div>\n"
        },
        {
            name: "Code 9",
            template: `
@{
    var tag = 'div';
    var tag2 = 'span';
}
<@tag>
    @{
        <@tag2></@tag2>
    }
</@tag>`,
            expected: "\n<div>\n        <span></span>\n</div>"
        },
        {
            name: "Code 10",
            template: `
<div>
    @{
        <span>@@</span>
    }
</div>`,
            expected: "\n<div>\n        <span>@</span>\n</div>"
        },
        {
            name: "Code 11",
            template: `
@for(var i = 0; i < 2; i++) {
    <div>@i</div>
}`,
            expected: "\n    <div>0</div>\n    <div>1</div>\n"
        },
        {
            name: "Code 12",
            template: `
@for(var i = 0; i < 1; i++) {
<div>
    <span>@i</span>
</div>
}`,
            expected: "\n<div>\n    <span>0</span>\n</div>\n"
        },
        {
            name: "Code 13",
            template: `
<div>  @(2 + 3)</div>`,
            expected: "\n<div>  5</div>"
        },
        {
            name: "Code 14",
            template: `
<div>
    @(2 + 3)
</div>`,
            expected: "\n<div>\n    5\n</div>"
        },
        {
            name: "Code 15",
            template: `<div>@(2 + 3)  </div>`,
            expected: "<div>5  </div>"
        },
        {
            name: "Code 16",
            template: `
<div>
    @(2 + 3)  
</div>`,
            expected: "\n<div>\n    5  \n</div>"
        },
        {
            name: "Code 17",
            template: `
@for(var i = 0; i < 1; i++) {
<div>
    @{
        var x = i + 1;
        <span>@x</span>
    }
</div>
}`,
            expected: "\n<div>\n        <span>1</span>\n</div>\n"
        },
        {
            name: "Code 18",
            template: `
@{
    function getValue() {
        return 123;
    }
}
<div>
    @getValue()
</div>
`,
            expected: "\n<div>\n    123\n</div>\n"
        },
        {
            name: "Code 19  (invalid)",
            template: `
@function getValue () {
    return 123;
}
<div>@getValue()</div>`,
            expected: "\n<div>123</div>"
        },
        {
            name: "Code 20",
            template: `
@{
    <span>X<span/>
}`,
            error: "'<span>' tag at line 3 pos 5 is missing mathing end tag."
        },
        {
            name: "Code 21",
            template: `
@{
    <span>/X</span>
}`,
            expected: "\n    <span>/X</span>\n"
        },
        {
            name: "Code 22",
            template: `
@{
    <span>X</div>
}`,
            error: "'</div>' tag at line 3 pos 12 is missing mathing start tag."
        },
        {
            name: "Code 23",
            template: `
@{
    <span><img/></span>
}`,
            expected: "\n    <span><img/></span>\n"
        },
        {
            name: "Code 24",
            template: `
@{
    <span>><</span>
}`,
            expected: "\n    <span>><</span>\n"
        },
        {
            name: "Code 25",
            template: `
@{
    <span><></span>
}`,
            expected: "\n    <span><></span>\n"
        },
        {
            name: "Code 26",
            template: `
@{
    <img/>
}`,
            expected: "\n    <img/>\n"
        },
        {
            name: "Code 27",
            template: `
@{
    <span><//span></span>
}`,
            expected: "\n    <span><//span></span>\n"
        },
        {
            name: "Code 28",
            template: `@{<>}`,
            error: "Tag name expected at line 1 pos 4."
        },
        {
            name: "Code 29",
            template: `@{<}`,
            error: 'The code or section block is missing a closing "}" character. Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line 1 with text: "@{<"'
        },
        {
            name: "Code 30",
            template: `
@for(var i = 0; i < 10; i++){
    <
}`,
            error: "Tag name expected at line 3 pos 6."
        },
        {
            name: "Code 31",
            template: `
@{
    <span>< /span>
}`,
            error: `'<span>' tag at line 3 pos 5 is missing mathing end tag.`
        },
        {
            name: "Code 31.1",
            template: `
@{
    <span>< span>
}`,
            error: `'<span>' tag at line 3 pos 5 is missing mathing end tag.`
        },
        {
            name: "Code 32",
            template: `
@{
    <span>< /span></span>
}`,
            expected: "\n    <span>< /span></span>\n"
        },
        {
            name: "Code 33",
            template: `
@{
    < span></span>
}`,
            error: "Tag name expected at line 3 pos 6."
        },
        {
            name: "Code 34",
            template: `
@{
    <span></ span>
}`,
            error: "Tag name expected at line 3 pos 13."
        },
        {
            name: "Code 35",
            template: `
@{ 
    <a title="@Model">text</a>
}`,
            expected: '\n    <a title="123">text</a>\n',
            model: 123
        },
        {
            name: "Code 36",
            template: '@{ <div style="background-color: greenyellow">SECTION TEST</div> }',
            expected: ' <div style="background-color: greenyellow">SECTION TEST</div> '
        },
        {
            name: "Code 37",
            template: '@{ <div><!--<span>--></div> }',
            expected: ' <div><!--<span>--></div> '
        },
        {
            name: "Code 38",
            template: '@{ <!--<span>--> }',
            expected: ' <!--<span>--> '
        },
        {
            name: "Code 39",
            template: '@',
            error: 'End-of-file was found after the "@" character at line 1 pos 2.'
        },
        {
            name: "Code 40",
            template: '@<',
            error: '"<" is not valid at the start of a code block at line 1 pos 2.'
        },
        {
            name: "Code 41",
            template: '<div>@(1 + 3]</div>',
            error: 'Invalid "]" symbol in expression at line 1 pos 13 after "<div>@(1 + 3".'
        },
        {
            name: "Code 42",
            template: '<div>@(1 + 3</div>',
            error: 'The explicit expression "@(1 + 3</div>" is missing a closing character ")" at line 1 pos 19.'
        },
        {
            name: "Code 43",
            template: `
@{
    <span></span>
)`,
            error: 'Invalid ")" symbol in expression at line 4 pos 1.'
        },
        {
            name: "Code 44",
            template: `@{ var regex = /}<div>/g; }`,
            expected: ''
        },
        {
            name: "Code 45",
            template: `
@{ 
    var paragraph = 'The }<div> quick brown fox.';
    var regex = /}<div>/g;
    var found = paragraph.match(regex);
}
<div>@Html.raw(found)</div>
`,
            expected: '\n<div>}<div></div>\n'
        },
        {
            name: "Code 46",
            template: `
@{ 
    var paragraph = 'The }<div> quick brown fox.';
}
<div>@Html.raw(paragraph.match(/}<div>/g))</div>
`,
            expected: '\n<div>}<div></div>\n'
        },
        {
            name: "Code 47",
            template: `
@{ 
    var paragraph = 'The )<div> quick brown fox.';
}
<div>@Html.raw(paragraph.match(/\\)<div>/g))</div>
`,
            expected: '\n<div>)<div></div>\n'
        },
        {
            name: "Code 48",
            template: `
<div>
@Html.raw("H");
@Html.raw("C")
</div>
`,
            expected: '\n<div>\nH;\nC\n</div>\n'
        },
        {
            name: "Code 49",
            template: `
<div>test</div>
@section Footer{
    <footer>
        <p>&copy; 2018</p>
    </footer>
}`,
            error: `Section 'Footer' in 'Code 49' has never been rendered. If a section exists it must be rendered.`
        },
        {
            name: "Code 50",
            template: `@{<span><img></span>}`,
            expected: '<span><img></span>'
        },
        {
            name: "Code 51",
            template: `@{<img>}`,
            expected: '<img>'
        },
        {
            name: "Code 52",
            template: `
@{
    <div style="background-color: yellow">
        <div>
    </div>
}
`,
            error: `'<div style="background-color: yellow">' tag at line 3 pos 5 is missing mathing end tag.`
        },
        {
            name: "Code 53",
            template: `@{<span>1'2</span>}`,
            expected: `<span>1'2</span>`
        },
        {
            name: "Code 54",
            template: `
@{
    var a = 1, b = 2;
}
@if (a > b) {
    <span>A</span>
}
else{
    <span>B</span>
}
`,
            expected: "\n    <span>B</span>\n"
        },
        {
            name: "Code 55",
            template: `
@{
    var a = 1, b = 2;
}
@if (a > b) {
    <span>A</span>
}
else
`,
            error: "'{' character is expected at line 8 pos 5"
        },
        {
            name: "Code 55.1",
            template: `
@{
    var a = 1, b = 2;
}
@if (a > b) {
    <span>A</span>
}
els
`,
            expected: "\nels\n"
        },
        {
            name: "Code 56",
            template: `
@{
    var a = 1, b = 2;
}
@while (a <= b) {
    <span>@a</span>
    a++;
}
`,
            expected: "\n    <span>1</span>\n    <span>2</span>\n"
        },
        {
            name: "Code 57",
            template: `
@{
    var a = 1, b = 2;
}
@do{
    <span>@a</span>
    a++;
} while (a <= b);
`,
            expected: "\n    <span>1</span>\n    <span>2</span>\n"
        },
        {
            name: "Code 58",
            template: `
@{
    var a = 1, b = 2;
}
@do{
    <span>@a</span>
    a++;
} while;
`,
            error: `'(' character is expected at line 8 pos 8.`
        },
        {
            name: "Code 59",
            template: `
@{
    var a = 1, b = 2;
}
@do{
    <span>@a</span>
    a++;
} whil
`,
            error: "'while' expected at line 8 pos 3."
        },
        {
            name: "Code 60",
            template: `
@{
    var a = 1, b = 2;
}
@do{
    <span>@a</span>
    a++;
} whil`,
            error: "'while' expected at line 8 pos 3."
        },
        {
            name: "Code 61",
            template: `
<div>JS</div>
@if (2 > 1) {
    <script type="text/javascript">
        var longText = "<div>";
    </script>
}`,
            expected: `
<div>JS</div>
    <script type="text/javascript">
        var longText = "<div>";
    </script>
`
        }
    ];
    module.exports = cases;
})();// 