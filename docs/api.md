[<< Back to start](../README.md)

# Razor-Express API

The Razor-Express module provides the following functions:

<a name="renderFile"></a>
## renderFile(filepath, options, done)
* **filepath** `<string>` full path to the view template file
* **options** `<Object>` parameters passed by the *Express* module
* **done** `<Function>` callback function
  * **err** `<RazorError>` Razor-Express parser or compiler error
  * **html** <string> rendered HTML

Asynchronously reads the [view template file](overview.md#views-and-view-template-engine), parses, compiles and renderes it to HTML. The `done` callback returns to the caller either the rendered HTML via the `html` argument or an error via the `err` argument if it occurs. 
This method is meant to be called by the [Express library](https://expressjs.com/) if you set the template engine explicitly: 

```JavaScript
const app = require('express')(); // the Express web server app.
const razor = require('razor') // the Razor-Express engine 
app.engine('raz', function (filePath, options, callback) {
  razor.renderFile(filePath, options, callback);
})
app.set('view engine', 'raz') // register the template engine
// ...
```
<sup>(example from the [Express docs](https://expressjs.com/en/advanced/developing-template-engines.html))</sup>


## __express(filepath, options, done)

Internally calls the [`renderFile()`](#renderFile) method if the Razor-Express engine is set just in one line of code:
```JavaScript
const app = require('express')(); // the Express web server app.
const razor = require('razor') // the Razor-Express engine 
app.set('view engine', 'raz') // register the template engine
// ...
```
<sup>(see [RazorExpressExample repository](https://github.com/DevelAx/RazorExpressExample))</sup>
