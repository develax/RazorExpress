[<< Back to start](../README.md)

# Debugging & Errors handling in Razor-Express

## Debugging view templates
(documentation in progress)

## Errors handling

Let's consider a minimum example of the Express web-server application which tries to render a view with incorrect HTML. 
> This exapmle is included into the [RazorExpressErrors](https://github.com/DevelAx/RazorExpressErrors) repository as [error-handling-1.js](https://github.com/DevelAx/RazorExpressErrors/blob/master/error-handling-1.js).

**Express web-server:**
```JS
const app = require("express")();
const raz = require("raz");

app.set('view engine', "raz");

app.get('/', (req, res) => {
    res.render("index");
});

const port = 1337;
app.listen(port, () => {
    console.log("Server is up on port " + port);
})
.on("error", (err) => {
    console.log("Error starting server: " + err.message);
});
```
**index.raz**
```HTML+RAZOR
<div>
    <span>
</div>
```

When you run this JavaScript code and open http://localhost:1337 in your browser you'll see the error like this:

![Razor-Express plain error](https://github.com/DevelAx/RazorExpressErrors/blob/master/docs/error-handling/PlainError.jpg?raw=true)

This is a standard error of `RazorError` type. However, in debug mode, you would most likely want to see something more informative. To get this you just need to register a default error handler. To fulfil your wish you just need to register the Razor default error handler. 
```JS
// Add this line after the `app.get(...)` line of the JS code.
raz.handleErrors(app);
```
Now run the app again and refresh the browser page. You will see the same error in HTML format:

![Razor-Express HTML error](https://github.com/DevelAx/RazorExpressErrors/blob/master/docs/error-handling/HtmlError.jpg)

Now it looks a little nicer and you can see not only the exception stack and error message but also the name of the file that caused the error as well as its content.   

The [`handleErrors`](api.md#handleerrorsapp-errorcode-mode) method has two additional parameters (`errorCode` and `mode`) by which you can pass the server response code and mode in which this error handler will be triggered. 

By default `errorCode` is `500`. This means that by default you'll get an HTML-formatted error and HTTP response with code 500 only if the `NODE_ENV` environment variable has a value not equal to `"production"` ([express](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production), [stackoverflow](https://stackoverflow.com/a/16979503/1844247)). If the `NODE_ENV` variable is not set at all then it's considered (by the Express) to be `"development"` by default.


### Custom error handler
Where appropriate you can create your own error handler and attach it to the Express app. You just have to make sure the error you get is of `RazorError` type by checking its `name` field. 

Example:
```JS
app.use(appErrorHandler);

function appErrorHandler(err, req, res, next) {
    if (res.headersSent)
        return next(err); // must

    var env = app.get('env');

    if (env !== "production" && err.name == "RazorError") {
        var errorHtml = err.html();
        res.status(500);
        res.send(errorHtml);
        return;
    }
    
    return next(err);
}
```
>The working example is located in the same [RazorExpressErrors](https://github.com/DevelAx/RazorExpressErrors) repository in the [error-handling-2.js](https://github.com/DevelAx/RazorExpressErrors/blob/master/error-handling-1.js) file.

Please, go to [expressjs.com](https://expressjs.com/en/guide/error-handling.html) to read more on *"The default error handler"* & *"Writing error handlers"* topics. Or at least take note of this qoute:
> You define error-handling middleware last, after other app.use() and routes calls...

## Parser and runtime errors
Although all errors are exposed to the user as an exception named *"RazorError"*, in fact, there are 2 types of errors and they occur at different stages of template processing. They are *parser errors* and *runtime errors*.

### Parser errors
You have already seen an example of the *parser error* in the ["Errors handling"](#errors-handling) section. Obviously, these errors occur in the process of parsing the template when the parser detects that there is something wrong with the structure of the template. This can be both HTML errors and JavaScript syntax errors. But mostly at this stage HTML structure errors are detected (as in the example in the ["Errors handling"](#errors-handling) section).

> It should be noted that the parser does not perform full validation of HTHL, but only separates JavaScript code fragments. This allows him not to do extra work and stay fast. At the same time, this means that it does not detect all HTML or JavaScript structure errors. However, this does not mean that the engine will not catch them at all - they will still be detected by the virtual machine when the template is compiled and cought by the engine.
