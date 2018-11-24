# Errors handling in Razor-Express

Let's consider a minimum example of the Express web-server application which tries to render a view with incorrect HTML. 
> This exapmle is included into the [RazorExpressExamples](https://github.com/DevelAx/RazorExpressExamples) repository as `error-handling-1.js`.

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

![Razor-Express plain error](https://github.com/DevelAx/RazorExpressExamples/blob/master/docs/error-handling/PlainError.jpg?raw=true)

This is a standard error of `RazorError` type. However, in debug mode, you would most likely want to see something more informative. To get this you just need to register a default error handler. To fulfil your wish you just need to register the Razor default error handler. 
```JS
// Add this line after the `app.get(...)` line of the JS code.
raz.handleErrors(app);
```
Now run the app again and refresh the browser page. You will see the same error in HTML format:

![Razor-Express HTML error](https://github.com/DevelAx/RazorExpressExamples/blob/master/docs/error-handling/HtmlError.jpg)

It looks a little nicer I guess. Now you can see not only the exception stack and error message but also the name of the file that caused the error as well as its content.   

The `handleErrors` method has two additional parameters (`errorCode` and `mode`) by which you can pass the server response code and mode in which this error handler will be triggered. 

By default `errorCode` is `500`  and `mode` is `"development"`. This means that by default you'll get an HTML-formatted error and HTTP response with code 500 only if the **NODE_ENV** environment variable has a value equal to `"development"` ([express](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production), [stackoverflow](https://stackoverflow.com/a/16979503/1844247)). If the NODE_ENV is not set at all then it's considered (by Express) to be `"development"` by default.


Custom error handler
===
Where appropriate you can create your own error handler and attach it to the Express app. You just have to make sure the error you get is of `RazorError` type by checking its `name` field. 

Example:
```JS
app.use(appErrorHandler);

function appErrorHandler(err, req, res, next) {
    if (res.headersSent)
        return next(err); // must

    var env = app.get('env');

    if (env === "development" && err.name == "RazorError") {
        var errorHtml = err.html();
        res.status(500);
        res.send(errorHtml);
        return;
    }
    
    return next(err);
}
```
The working example is located in the same [RazorExpressExamples](https://github.com/DevelAx/RazorExpressExamples) repository in the `error-handling-2.js` file.
