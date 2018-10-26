(function () {
    var cases = [
        {
            name: "Invalid Model 1",
            template: '<span>@Model.val</span>',
            error: 'Cannot read property \'val\' of undefined'
        }
    ];
    module.exports = cases;
})();
