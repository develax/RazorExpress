var cases = [
    {
        name: "Invalid-HTML 1",
        template: `<div>< span>text</span></div>`,
        error: "'</span>' tag at line 1 pos 17 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 1.1",
        template: `<div><img title="test" />< span>text</span></div>`,
        error: "'</span>' tag at line 1 pos 37 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 1.2",
        template: `<div>< span>text<img title="test" /></span></div>`,
        error: "'</span>' tag at line 1 pos 37 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 1.32",
        template: `<div>< span>text</span><img title="test" /></div>`,
        error: "'</span>' tag at line 1 pos 17 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 2",
        template: `<div><span>text</ span></div>`,
        error: "'</div>' tag at line 1 pos 24 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 2.1",
        template: `<div><span><img title="test" />text</ span></div>`,
        error: "'</div>' tag at line 1 pos 44 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 2.2",
        template: `<div><span>text</ span><img title="test" /></div>`,
        error: "'</div>' tag at line 1 pos 44 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 3",
        template: '<span>',
        error: "'<span>' tag at line 1 pos 1 is missing matching end tag."
    },
    {
        name: "Invalid-HTML 4",
        template: `
@{
    <div>< span>text</span></div>
}`,
        error: "'</span>' tag at line 3 pos 21 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 5",
        template: `
@{
    </span>
}`,
        error: "'</span>' tag at line 3 pos 5 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 6",
        template: `
@{
    <span>
}`,
        error: "'<span>' tag at line 3 pos 5 is missing matching end tag."
    },
    {
        name: "Invalid-HTML 7",
        template: `
@{
    <div>
        <span>
    </div>
}`,
        error: "'</div>' tag at line 5 pos 5 is missing matching start tag."
    },
    {
        name: "Invalid-HTML 8",
        template: `
@{
    <<div></div>
}`,
        error: "Unexpected '<' character at line 3 pos 6 after '    <<'"
    },
    {
        name: "Invalid-HTML 9",
        template: `
<div>
    @{
        @@
    }
</div>`,
        error: "Unexpected '@' character at line 4 pos 9."
    },
    {
        name: "Invalid-HTML 10",
        template: `
<div style="background-color: yellow">
    <div>
</div>
`,
        error: `'<div style="background-color: yellow">' tag at line 2 pos 1 is missing matching end tag.`
    }
];

export default cases;