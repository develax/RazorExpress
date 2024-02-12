(function () {
    var cases = [
        {
            name: "Invalid Model 1",
            template: '<span>@Model.val</span>',
            error: 'Cannot read properties of undefined (reading \'val\')'
        }
    ];
    module.exports = cases;
})();
