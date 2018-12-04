(function () {
    var cases = [
        {
            name: "Section 0",
            template: `
@section Test{
    <div style="background-color: greenyellow">SECTION TEST</div>
    @Html.raw("123");
    @Html.raw("456");
}`,
            error: "Unexpected '@' character at line 4 pos 5."
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
            error: "Unexpected '@' character at line 4 pos 5."
        },
        {
            name: "Section 1.1",
            template: `
<div>
@section Scripts{
    <div>
        @section Inner{
            <script></script>
        }
    </div>
}
</div>`,
            error: "Section blocks cannot be nested at line 5 pos 9."
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
            error: `Section 'Scripts' at line 5 pos 14 has been already defined in the file 'Section 8'. You cannot assign the same name to different sections in the same file.`
        },
        {
            name: "Section 9",
            template: `
<div>
    @section Scripts{
        <script></script>`,
            error: 'The code or section block is missing a closing "}" character. Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line 3 with text: "    @section Scripts{"'
        },
        {
            name: "Section 10",
            template: `
@section Scripts {
    <script>
    </script>
`,
            error: 'The code or section block is missing a closing "}" character. Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line 2 with text: "@section Scripts {"'
        },
        {
            name: "Section 11",
            template: `
@section Header{
    <h1>
        @Model.header
    </h1>
}
@Html.section("Header")
`,
            model: { header: "test" },
            expected: '\n    <h1>\n        test\n    </h1>\n\n'
        }
    ];
    module.exports = cases;
})();// 