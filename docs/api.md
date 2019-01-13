[<< Back to start](../README.md)

# Razor-Express API

- [**For NodeJS Express web-server**](#for-express)
  - [`setup`](#setup)
  - [`renderFile`](#renderFile)
  - [`__express`](#__express)
  - [`handleErrors`](#handleErrors)
  - [`debug`](#debug)
- [**Direct rendering string templates to HTML**](#direct-rendering)
  - [`render`](#render)

The Razor-Express module exports the following functions:

<a name="for-express"></a>
## For NodeJS Express web-server

<a name="register"></a>
### register(app, ext)
* **app** `<express>` instance of the Express app
* **ext** <String> view template file extension, *default:* 'raz'

Example:
```JavaScript
const raz = require('raz');
raz.register(app);
// ...
```

<a name="renderFile"></a>
### renderFile(filepath, options, done)
* **filepath** `<string>` full path to the view template file
* **options** `<Object>` parameters passed by the *Express* module
* **done** `<Function>` callback function
  * **err** `<RazorError>` Razor-Express parser or compiler error
  * **html** <string> rendered HTML

Asynchronously reads the [view template file](overview.md#views-and-view-template-engine), parses, compiles, and renderes it with all its referenced views to HTML. The `done` callback returns to the caller either the rendered HTML via the `html` argument or an error via the `err` argument if it occurs. 
This method is meant to be called by the [Express library](https://expressjs.com/) in case you set the template engine handler explicitly: 

```JavaScript
const app = require('express')(); // the Express web server app.
const razor = require('raz'); // the Razor-Express engine 
app.engine('raz', function (filePath, options, callback) {
  razor.renderFile(filePath, options, callback);
})
app.set('view engine', 'raz'); // register the template engine
// ...
```
<sup>(example from the [Express docs](https://expressjs.com/en/advanced/developing-template-engines.html))</sup>

<a name="__express"></a>
### __express(filepath, options, done)

If any view engine is set in one line of code, like in this example:
```JavaScript
const app = require('express')(); // the Express web server app
app.set('view engine', 'raz'); // register the RAZ template engine
// ...
```
the [Express looks](https://expressjs.com/en/guide/using-template-engines.html) for the `__express()` method and calls it when a view template needs to be rendered. The `__express()` internally calls [`renderFile()`](#renderFile), so there is no difference between them except that the `__express()` function is intended to be used by the Express app *only*.

<sup>(see [RazorExpressExample repository](https://github.com/DevelAx/RazorExpressExample))</sup>

<a name="handleErrors"></a>
### handleErrors(app, errorCode)
* **app** `<express>` instance of the Express app
* **errorCode** `<integer>`, *default:* 500

Sets the engine's built-in error handler, after which all Razor-Express errors will be converted to the HTML format with the specified error code. This handler will work only if the `NODE_ENV` environment variable is not equal to *"production"*. 
```js
const app = require('express')(); // the Express web server app
const raz = require('raz'); // the Razor-Express engine 
raz.handleErrors(app); // set default error-handler for Razor-Express errors
```
See also the ["Errors handling"](Debugging.md#errors-handling) section.

<a name="debug"></a>
### debug
A boolean constant that determines whether the code is running in debug mode.
```js
const raz = require("raz");
if (raz.debug) {
  console.log("debug mode is on");
}
```

<a name="direct-rendering"></a>
## Direct rendering string templates to HTML

<a name="render"></a>
### render(template)
* **template** `<String>` template in [Razor-Express format](syntax.md)
* Returns: `<String>` rendered HTML.

Renderes HTML from the Razor-Express templated text passed in the `template` parameter:
```js
require("raz").compile("Today is @(new Date())");
```

### render({ template, model })
* **template** `<String>` template in [Razor-Express format](syntax.md)
* **model** `<Object>` data for the template, *default*: `undefined`
* Returns: `<String>` rendered HTML.

Renderes HTML from the Razor-Express templated text passed in the `template` parameter and the data passed in the 'model' parameter:
```js
require("raz").compile({ template: "It's @Model now.", model: new Date().getFullYear() });
```
