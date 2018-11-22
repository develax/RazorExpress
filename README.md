# Razor-Express View Template Engine 
**(draft)**


When I just started to dive into the world of **Node.js** after years of working with [ASP.NET MVC](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview) I couldn't find any **view template engine** that was as convenient, elegant, concise, and syntactically close to native HTML as [Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/layout). I may be exaggerating its merits and maybe it's all just a matter of habit, but I decided to try to create something similar for using in **Node.js** with **Express** library. I must say that I was able to find the closest to **Razor** supported library, but some points were quite different from **Razor** which I was used to and they just looked much less concise and convenient to me (like layouts and partial blocks, for example). So, let's proceed to the description of my creation... my first **JavaScript** creation actually.

Quick Start
===
Let's first quickly look at the key concepts and terms.

What is View Template?
---
In most cases when building an HTML page we want to display some data on it. To perform this task, we need the **data** itself and the **page template** (that defines the rules through a special markup language for displaying the data in HTML format). The page template is usually referred to simply as a **"view"** and the data is referred to as a **"view model"** or just **"model"**. So, this is what is usually called *"view templating"*. This consept is used for separating concerns within a web application (for more details [read this](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview)).

What is View Template Engine?
---
A **template engine** allows you to create HTML pages based on the model data and the view template. In other words the engine can understand the view template markup laguage and it also knows how to apply your model data to it to get the HTML page you need.

What is Razor-Express
---
**Razor-Express** is a view template engine which can understand *Razor-like markup language* syntax. Razor-Express is intended to be used with the [Express library](https://expressjs.com/) but it also can be used with any other library or purpose.

> To get more about using template engines with Express read [their guide](https://expressjs.com/en/guide/using-template-engines.html).

Examples
---

Now when you've got the basic idea let's look at two simple examples of using *Razor-Express markup*, which allow you to form the first perception before going into details. 

**The task:** to compile an HTML markup to display all the days of the week and the title. 

To do this, we need to create a *model* and a *view* template.

The **model** is just a JavaScript object:
```js
{
    title: "Names of the Days of the Week",
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
```
The **view** is the HTML markup mixed with JavaScript syntax (more in the Razor-Express syntax paragraph [!]):
```HTML+Razor
<h3>@Model.title</h3>
<ul>
@for(var i = 0; i < Model.days.length; i++){
    var day = Model.days[i];
    <li>@day</li>
}
</ul>
```
We are going to perform this task in two ways. 
* The first, we will use Razor-Express alone in the Node.js environment to compile HTML just as a string. 
* The second, we will use it with the Express library to create a simple web-server.

Node.js example
---
```js
const model = {
    title: "Names of the Days of the Week",
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

const template = `
<h3>@Model.title</h3>
<ul>
@for(var i = 0; i < Model.days.length; i++){
    var day = Model.days[i];
    <li>@day</li>
}
</ul>`;

const razor = require("razor-express");
var html = razor.compileSync({ model, template });

// Output the `html` variable value to see the result.
console.log(html);
```
Here's what we will see in the console:
```html
<h3>Names of the Days of the Week</h3>
<ul>
    <li>Sunday</li>
    <li>Monday</li>
    <li>Tuesday</li>
    <li>Wednesday</li>
    <li>Thursday</li>
    <li>Friday</li>
    <li>Saturday</li>
</ul>
```
Here is the [playground](https://runkit.com/develax/5bf574e98b71430012d4e641) of this example.

Node.js + Express example
---
All the code is in the **server.js** file.
```js
// Create Express web server app.
const app = require('express')();

// Register 'Razor' template engine and the default extesnion for the view-template files.
// 'Express' will automatically find the Razor module (within the `node-modules` folder) using this extension. 
// If you decide to skip registering the engine then you will have to explicitly specify the file extension in the route handler.
app.set('view engine', "raz");

// Create the route for the "Index.raz" view-template.
// Note that we do not specify the file extension explicitly in this route because we already did it when registering the engine.
app.get('/', (req, res) => {
    const model = {
        title: "Names of the Days of the Week",
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    res.render("./index", model);
});

// Express-app default port number.
const port = process.env.PORT || 8080;

// Starting Express-app.
const server = app.listen(port, () => {
    console.log("Server is up on port " + port);
});

// Catch Express-app errors.
server.on('error', function (e) {
    if (e.code === 'EADDRINUSE') {
        console.error('Address is in use, stopped.');
    }
});
```

The **index.raz** view-template is pretty much the same as in the previous example except we have to add some basic HTML markup. Notice that the file has **'.raz'** extension which every Razor view template file must have.
```HTML+Razor
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>@Model.title</title>
  </head>
  <body>
    <h2>@Model.title</h2>
    <ul>
    @for(var i = 0; i < Model.days.length; i++){
        var day = Model.days[i];
        <li>@day</li>
    }
    </ul>
  </body>
</html>
```
Now if you **run server.js** and open http://localhost:8080/ URL in the browser you will see the HTML page showing something like this:
___
> ### Names of the Days of the Week
> * Sunday
> * Monday
> * Tuesday
> * Wednesday
> * Thursday
> * Friday
> * Saturday
____

:sparkles: *The Express server app with Razor template engine works!* :sparkles:

The source code of this example is available in [RazorExpressExample](https://github.com/DevelAx/RazorExpressExample) repository.

----------------------
DRAFT:
----------------------
* `Html.layout` is optional.
* `Html.body` is optional.
* `Html.section` can be called from the `Layout`and any other `View`.
* `@section {...}` can be declared in any `View` including partial views.

* Run tests: npm run testmon
*     "start": "node ./test/server.live.js",
