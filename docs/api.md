[<< Back to start](../README.md)

# Razor-Express API

The Razor-Express module provides the following functions:

## renderFile(filepath, options, done)
* **filepath** `<string>` full path to the view template file
* **options** `<Object>` parameters passed by the *Express* module
* **done** `<Function>` callback function
  * **err** `<RazorError>` Razor-Express parser or compiler error

This method is meant to be called by the [Express library](https://expressjs.com/en/advanced/developing-template-engines.html) if you set the template engine explicitly: 
```JavaScript
const razor = require('razor') // the Razor-Express engine 
app.engine('raz', function (filePath, options, callback) {
  razor.renderFile(filePath, options, callback);
})
app.set('views', './views') // specify the views directory
app.set('view engine', 'ntl') // register the template engine
// ...
```
