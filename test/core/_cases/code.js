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
        }
    ];
    module.exports = cases;
})();
