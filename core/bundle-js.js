// Version: 1.0.0

const parser = require('./parser')();

raz = {
    render: (template, model) => {
        return parser.compileSync(template, model);
    }
}