[<< Back to start](../README.md)

# Debugging & Errors handling in Razor-Express

- [**Production & development modes**](#production--development-modes)
- [**Errors handling**](#errors-handling)
  - [Custom error handler](#custom-error-handler)
- [**Parser errors & runtime errors**](#parser-errors--runtime-errors)
- [**Errors visualization in the inner templates**](#errors-visualization-in-the-inner-templates)

## Production & development modes
[Express](https://expressjs.com) distinguishes between 2 startup modes: development mode and [production mode](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production). If the `NODE_ENV` environment variable has a value not equal to `"production"` or it is not set at all ([stackoverflow](https://stackoverflow.com/a/16979503/1844247)) then it considered to as if it were set to `"development"`. So does the Razor-Express - in development mode it generates additional debugging information to help localize the error location.

## Errors handling

Let's consider a minimum example of the Express web-server application which tries to render a view with incorrect HTML. 
<sup>* This exapmle is included into the [RazorExpressErrors](https://github.com/DevelAx/RazorExpressErrors) repository as [error-handling-1.js](https://github.com/DevelAx/RazorExpressErrors/blob/master/error-handling-1.js).</sup>

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

By default `errorCode` is `500`. This means that by default you'll get an HTML-formatted error and HTTP response with code 500 only if the app is run in [development mode](#production--development-modes).


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
<sup>* The working example is located in the same [RazorExpressErrors](https://github.com/DevelAx/RazorExpressErrors) repository in the [error-handling-2.js](https://github.com/DevelAx/RazorExpressErrors/blob/master/error-handling-1.js) file.</sup>

Please, go to [expressjs.com](https://expressjs.com/en/guide/error-handling.html) to read more on *"The default error handler"* & *"Writing error handlers"* topics. Or at least take note of this qoute:
> You define error-handling middleware last, after other app.use() and routes calls...

## Parser errors & runtime errors
Although all errors are exposed to the user as an exception named *"RazorError"*, in fact, there are 2 types of errors and they occur at different stages of template processing. They are *parser errors* and *runtime errors*.

You have already seen an example of the *parser error* in the ["Errors handling"](#errors-handling) section. Obviously, these errors occur in the process of parsing the template when the parser detects that there is something wrong with its structure. This can be both HTML errors and JavaScript syntax errors. But mostly at this stage HTML structure errors are detected (as in the example in the ["Errors handling"](#errors-handling) section).

It should be noted that the parser does not perform full validation of HTHL, but only separates JavaScript code fragments. This allows it not to do extra work and stay fast. At the same time, this means that it does not detect all HTML or JavaScript structure errors. However, this does not mean that the engine will not catch them at all - all JavaScript errors will be detected by the virtual machine when the template is compiled and then they will be caught by the engine. All this happens at the second stage of processing of the template and these errors are called *runtime errors*.

So you may wonder why you need to know all this if this separation exists only inside? Well, that's true, but you'd better know that *highlighting parser errors in the template source code is more accurate* than runtime errors. And all because the virtual machine does not give the exact coordinates of the error occurred. Nevertheless, I tried to make them as accurate as possible and in most cases they really are! 

## Errors visualization in the inner templates
When an error is rendered as formatted HTML, the source code of the view template in which the error occurred is displayed with the location of the error code highlighted in there. But what if the error occurred not in the main template, but in a partial view? What template source code should be displayed in this case?

For a more visual representation of where the error took place, the entire chain of the view templates will be presented in the order they are compiled. Let's look at an example where an error occurs in a partial view. 

<sup>* You can find this example in [RazorExpressErrors](https://github.com/DevelAx/RazorExpressErrors) repository, there you should run the [inner-error-example.js](https://github.com/DevelAx/RazorExpressErrors/blob/master/inner-error-example.js) file under the NodeJS and open [http://localhost:1337/](http://localhost:1337/) in the browser.</sup>

This example consists of two view templates: *"index.raz"* is the main view which has a reference to a partial view *"_people.raz"*. And the list of some people is passed via Model (defined in the [inner-error-example.js](https://github.com/DevelAx/RazorExpressErrors/blob/master/inner-error-example.js) file).

**Model**
```JS
var people = [
    { name: "Willis Wethington", age: 42 },
    { name: "Georgie Graddy", age: 36 },
    { name: "Ileen Irizarry", age: 24},
    { name: "Arnoldo Abreu", age: 10 },
    { name: "Rosa Robb", age: 18 },
    { name: "Otelia Orman", age: 65 },
     ];
```

**index.raz**
```HTML+RAZOR
<div>
    Index page content...
    @Html.partial("_people")
</div>
```

**__people.raz**
```HTML+RAZOR
<div>
    <h2>People</h2>
    <ul>
        @for(var i = 0; i <= Model.people.length; i++){
            <li><strong>@Model.people[i].name</strong><span> - </span><span>@Model.people[i].age</span></li>
        }
    </ul>
</div>
```

As you can seen the partial view should render a list of people and where we have intentionally added the error of going beyond the array. As a result you will see the next error views chain in the browser:

![Visualization of Razor-Express error through views chain](https://github.com/DevelAx/RazorExpressErrors/blob/master/docs/inner-error-example/ErrorView.jpg?raw=true)

The first is the error itself with the call stack. Then, the *"index.raz"* view template that is compiled first and references the partial view *"_people.raz"*, which is compiled after the "index.raz" and displayed at the very bottom of the page. In both sources, the code fragment in which the error occurred is highlighted in red.

As you may have noticed, a comment with the full path to this file is added at the very beginning of each template file. This doesn't happen in *"production"* mode.
