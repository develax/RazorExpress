const scope = {
    test: "BBB",
    fnTest: function () {
        return "CCC";
    }
}

export default [
    {
        name: "Scope 1",
        template: '<span>@Model.test</span><span>@test</span><span>@fnTest()</span><span>@Model.$</span>',
        expected: "<span>AAA</span><span>BBB</span><span>CCC</span><span></span>",
        model: { test: "AAA", $: scope }
    }
];