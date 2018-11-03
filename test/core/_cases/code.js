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
            error: "Unexpected end of input"
        },
        {
            name: "Code 20",
            template: `
@{
    <span>X<span/>
}`,
            error: "'<span>' tag at line 3 pos 5 is missing mathing end tag: '    <span>' <--"
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
            error: "'</div>' tag at line 3 pos 12 is missing mathing start tag: '    <span>X</div>' <--"
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
            error: "Tag name expected at line 1 pos 4: '@{<' <--"
        },
        {
            name: "Code 29",
            template: `@{<}`,
            error: 'The code block is missing a closing "}" character. Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line 1 with text: "@{"'
        },
        {
            name: "Code 30",
            template: `
@for(var i = 0; i < 10; i++){
    <
}`,
            error: "Tag name expected at line 3 pos 6: '    <' <--"
        },
        {
            name: "Code 31",
            template: `
@{
    <span>< /span>
}`,
            error: `'<span>' tag at line 3 pos 5 is missing mathing end tag: '    <span>' <--`
        },
        {
            name: "Code 31.1",
            template: `
@{
    <span>< span>
}`,
            error: `'<span>' tag at line 3 pos 5 is missing mathing end tag: '    <span>' <--`
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
            error: "Tag name expected at line 3 pos 6: '    <' <--"
        },
        {
            name: "Code 34",
            template: `
@{
    <span></ span>
}`,
            error: "Tag name expected at line 3 pos 13: '    <span></' <--"
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
            error: 'Invalid "]" symbol in expression at line 1 pos 13 after "<div>@(1 + 3" <--'
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
            error: 'Invalid ")" symbol in expression at line 4 pos 1 after "" <--'
        },
        {
            name: "Section 1",
            template: `
<div>
@section Scripts{
    @section Inner{
        <script></script>
    }
}
</div>`,
            error: "Section blocks cannot be nested at line 4 pos 5."
        },
        {
            name: "Section 2",
            template: `
<div>
@section Scripts{
    <script>
        @section Inner{
        }
    </script>
}
</div>`,
            error: 'Section blocks cannot be nested at line 5 pos 9.'
        },
        {
            name: "Section 3",
            template: `
<div>
    @section {}
</div>`,
            error: `A section name expected after the "@section" keyword at line 3 pos 14.`
        },
        {
            name: "Section 4",
            template: `
<div>
    @section{}
</div>`,
            error: `A whitespace expected after the "@section" keyword at line 3 pos 13.`
        },
        {
            name: "Section 5",
            template: `
<div>
    @section 123{}
</div>`,
            error: `A section name cannot start with '1' at line 3 pos 14.`
        },
        {
            name: "Section 6",
            template: `
<div>
    @section Scripts-1 {}
</div>`,
            error: `A section name cannot include '-' character at line 3 pos 21.`
        },
        {
            name: "Section 7",
            template: `
<div>
    @section Scripts
</div>`,
            error: `Unexpected literal '<' following the 'section' directive at line 4 pos 1. Expected '{'.`
        },
        {
            name: "Section 8",
            template: `
<div>
    @section Scripts{
    }
    @section Scripts{
    }
</div>`,
            error: `The section 'Scripts' at line 5 pos 14 has been already defined.`
        },
        {
            name: "Section 9",
            template: `
<div>
    @section Scripts{
        <script></script>`,
            error: `The section block 'Scripts' is missing a closing "}" character.`
        }
    ];
    module.exports = cases;
})();// 