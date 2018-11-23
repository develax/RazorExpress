# Razor-Express View Template Engine 
**(draft)**


When I just started to dive into the world of **Node.js** after years of working with [ASP.NET MVC](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview) I couldn't find any **view template engine** that was as convenient, elegant, concise, and syntactically close to native HTML as [Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/layout). I may be exaggerating its merits and maybe it's all just a matter of habit, but I decided to try to create something similar for using in **Node.js** with **Express** library. The closest to **Razor** supported library I could found was [Vash](https://www.npmjs.com/package/vash), but some points of it were quite different from **Razor** which I was used to and they just looked much less concise and convenient to me (like layouts and partial blocks, for example). 

Although I tried to make my library as close as possible to Razor there are certain differences that need to be taken into account. So, enough lyrics, let's get started look into my creation... it's my first JavaScript creation actually.

Quick Start
===

Assuming that you are already familiar with [the basic idea](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#the-overview-of-razor-express) let's look at a simple example. 

Our **first component** is a **model**:
```js
{
    title: "Names of the Days of the Week",
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
```
which is just a *JavaScript object*. And we want to get some HTML displaying the data of this model in some simple way. Later we might want to change the model data and still get the same HTML structure to display it. So, we need our **second component** which is called **view-template**:
```HTML+Razor
<h3>@Model.title</h3>
<ul>
@for(var i = 0; i < Model.days.length; i++){
    var day = Model.days[i];
    <li>@day</li>
}
</ul>
```

As you can see the **view-template** (or just **view**) is just the *HTML markup mixed with JavaScript syntax*. This is exactly what Razor-Express syntax is [!].

**First**, we'll do this "compilation" without creating any web-server to keep things as simple as possible. It can be done either in Node.js environment or in just the browser JavaScript. To do this we will declare two variables `model` and `tempate`:

```JS
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
```
...which are pretty much self-explained as we remember what our two components are. Next, we have to compile them together using Razor-Express library to get the expected HTML:

```JS
// This code is meant for Node.js 
const razor = require("raz");
var html = razor.compileSync({ model, template });
```

Now let's display it in the console to make sure our expectations are fully met.

```JS
console.log(html);
```
Here's what we can see in the console:
```HTML
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
