# RAZ: Razor-Express view template engine
<sub>* *This is a draft version of the manual, although the code itself has already been tested and works.*</sub>
<sup>* *While the documentation is under development, use [this repository](https://github.com/DevelAx/RazorExpressFullExample) for more comprehensive examples.*</sup>

- [**Intro**](#intro)
  - [A brief comparison of syntax of Node.JS layout engines](#a-brief-comparison-of-syntax-of-nodejs-layout-engines)
- [**Quick Start**](#quick-start)
  - [Node.js example](#nodejs-example)
  - [Express web-server example](#express-web-server-example)
- [**Overview**](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md)
  - [What is View Template](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#what-is-view-template)
  - [What is View Template Engine](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#what-is-view-template-engine)
  - [What is Razor-Express](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#what-is-razor-express)
  - [Razor-Express syntax](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#razor-express-syntax-reference-for-nodejs)
- [**Razor-Express View API**](#razor-express-view-api)
  - [Analogues of ASP.NET MVC Razor HtmlHelper methods](#analogues-of-aspnet-mvc-razor-htmlhelper-methods)
  - [Examples of usage](#examples-of-usage)
- [**Common pitfalls & remarks**](#warning-common-pitfalls)
  - [Missing semicolon](#missing-semicolon)
- [**Debugging & Errors handling in Razor-Express**](https://github.com/DevelAx/RazorExpress/blob/master/docs/Debugging.md)
  - **Debugging view templates**
  - [**Errors handling**](https://github.com/DevelAx/RazorExpress/blob/master/docs/Debugging.md#errors-handling)
    - [Custom error handler](https://github.com/DevelAx/RazorExpress/blob/master/docs/Debugging.md#custom-error-handler)
  
-----------------------


Intro
===

When I just started to dive into the world of *Node.js* after years of working with [ASP.NET MVC](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview) I couldn't find any *view template engine* that was as convenient, elegant, concise, and syntactically close to native [HTML](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics) as [ASP.NET MVC Razor syntax](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) was. And when it comes to code it's also syntactically close to the original [C# language](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/). Actually, **ASP.NET MVC Razor markup is a hybrid of HTML markup and C# programming language**. This is exactly what I expected to see in the *NodeJS* world - **a hybrid of HTML and JavaScript**. 

The closest to *Razor* currently supported library for *NodeJs & Express* I could find was [Vash](https://www.npmjs.com/package/vash). But in some points, it was quite different from *ASP.NET MVC Razor* syntax which I was used to and it just looked much less concise and convenient to me (the concepts of layouts and partial blocks, for example). In short, it did not suit me completely and what's more important I couldn't see its current development. 

A brief comparison of syntax of Node.JS layout engines
---

I may be exaggerating the merits of *ASP.NET MVC Razor* and maybe it's all just a matter of habit, but let's look at a few examples that I found on the web ([the question on Quora](https://www.quora.com/What-is-the-best-Node-js-template-engine)):

This is our **data model** represented via a JavaScript object:
```JS
var model = {
    subject: "Template Engines",
    items: [
        {name: "Mustache"},
        {name: "HandleBar"},
        {name: "Dust"},
        {name: "Jade"},
        {name: "EJS"},
        {name: "Razor"},
    ]
};
```
#### Mustache / HandleBar
```HTML+Django
<h1>{{subject}}</h1>
<ul>
  {{#items}}
    <li>{{name}}</li>
  {{/items}}
</ul>
```
<sup>^ [mustache live example](https://codepen.io/develax/pen/wQOpNQ)</sup>

----------------------

#### Pug (Jade)
```Pug
h1=model.subject  
ul
  each item in model.items
      li=item.name 
```
<sup>^ [pug live example](https://codepen.io/develax/pen/dQrJEV)</sup>

----------------------

#### EJS
```ejs
<h1><%= model.subject %></h1>
<ul>
  <% for(var i = 0; i < model.items.length; i++) {%>
     <li><%= model.items[i].name %></li>
  <% } %>
</ul>
```
<sup>^ [ejs live example](https://codepen.io/develax/pen/WYmMMv)</sup>

----------------------

#### Razor
```HTML+RAZOR
<h1>@Model.subject</h1>
<ul>
  @for(var i = 0; i < Model.items.length; i++) {
     <li>@Model.items[i].name</li>
  }
</ul>
```
<sup>^ [razor live example](https://runkit.com/develax/razor-list-example)</sup> 

#### Haml
Or let's consider an example from http://haml.info/tutorial.html
```Haml
.item{:id => "item#{item.id}"}= item.body
```
Maybe I'm wrong and this kind of markup really simplifies the development and perception of the code, but to me, it doesn't seem to be so. Let's just compare it to the equivalent Razor markup:
```HTML+Razor
<div class='item' id='item@item.id'>
  @item.body
</div>
```


I won't go much into all the aspects I don't like in other engines syntax just say that *"[Mustache](https://www.npmjs.com/package/mustache) / [HandleBar](https://handlebarsjs.com/)"*, *"[Pug](https://pugjs.org)"*, and *[Haml](http://haml.info/)* look like I have to learn a new syntax while with *Razor* I virtually know it if I'm already familiar with *HTML* and *JavaScript* languages. *EJS* is very close to *Razor* but it to verbose that make it difficult to write and read the code.

In these examples I don't compare logic constructions because some of the view engines have logic-less templating syntax.
With *Razor* you can implement amost any logic that is available with normal *JavaScript* without learning a new syntax.

Given all the mentioned and unmentioned pros and cons, I decided not to part with *Razor-syntax* and create something similar for using with [ExpressJS](https://expressjs.com) library (currently it works only in *NodeJS* environment, not in browsers).

-----------------------

Quick Start
===

Assuming that you are already familiar with the [basic idea](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#the-overview-of-razor-express) let's look at a simple example. 

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

As you can see the **view-template** (or just **view**) is nothing more than *HTML markup mixed with JavaScript syntax*. This is exactly what [Razor-Express syntax](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#razor-express-syntax-reference-for-nodejs) is.

Now we are going to take these two components and "compile" them into pure HTML.   

Node.js example
---
First, we'll be doing this "compilation" without creating any web-server to keep things as simple as possible. It can be done either in Node.js environment or in just the browser JavaScript. To do this we will declare two variables `model` and `template`:

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
...which are pretty much self-explained as we remember what our two components are. Next, we have to compile them together using Razor-Express library to get the expected HTML.

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
That's all! Isn't it simple?

<sup>* If you'd like to see all these parts working together here is the [playground](https://runkit.com/develax/razor-quick-example) of it.</sup>

Express web-server example
---
**server.js** file with comments:
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

**index.raz** file is just a *view-template* which is pretty much the same as in the previous example except we have to add some basic HTML markup. We put this file into the *"views"* folder which is a default folder for the Express app. Notice that the file has **'.raz'** extension which every Razor *view* file must have.
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
Now you if run the '**node server.js**' command in console (or terminal) and open http://localhost:8080/ URL in your browser you will see the HTML page showing something like this:
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

*The Express server app with Razor template engine works!* :thumbsup:

<sup>* The source code of this example is available in [RazorExpressExample](https://github.com/DevelAx/RazorExpressExample) repository.</sup>


Razor-Express View API
===
Analogues of ASP.NET MVC Razor HtmlHelper methods
---

Razor-Express methods | ASP.NET MVC methods | use
------------ | ------------- |-------------
Html.layout | Layout | specifies a layout
Html.body | RenderBody | renders the contents of the view
Html.partial |  Html.RenderPartial & Html.Partial | renders the content of the partial view
Html.raw | Html.Raw | renders a string without encoding
Html.getPartial | -- | returns a partial view as a string (not encoded)
Html.getEncoded | -- | returns an encoded string


### Examples of usage
#### @Html.layout
```HTML+RAZOR
@{
    Html.layout = "_layout";
}
```
#### @Html.body
```HTML+RAZOR
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  ...
  @Html.body()
  ...
</body>
</html>
```
#### @Html.partial
```HTML+RAZOR
<div>
  @Html.partial("_userForm")
</div>
```
or
```HTML+RAZOR
@if(Model.showUserForm){
    Html.partial("_userForm");
}
```
#### @Html.getPartial
```HTML+RAZOR
@{
  var userFormHtml = (Model.showUserForm) ? Html.getPartial("_userForm") : null;
}
@Html.raw(userFormHtml)
```
#### @Html.raw
```HTML+RAZOR
@{
  var boldText = "This is an example of <b>bold text</b>.";
}
<span>@Html.raw(boldText)</span>
```

:warning: Common pitfalls
===
Missing semicolon
---
Some developers have a habit of not putting a semicolon at the end of JavaScript code lines. This is a personal matter of course, although not considered good form. **As for JavaScript in the Razor-Express engine templates, a semicolon at the end of JavaScript expressions is strictly required!** If you do not follow this requirement, there may be cases when Razor isn't able to understand your instructions and throws a pretty vague error. Let's take a look at this example.

```JS
// Semicolon is missed at the end of the line of code "var text = i * i".
const template = `
<ul>
@for(var i = 0; i < 10; i++){
    var text = i * i
    <li>@text</li>
}
</ul>`;

const razor = require("raz")

try{
    var html = razor.compileSync({ template });
}
catch(err){
    console.log(err);
}
```
If you run this code you will get the error:
> RazorError: **The code or section block is missing a closing "}" character.** Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line 3 with text: "@for(var i = 0; i < 10; i++){"

[Test this example with RunKit.](https://runkit.com/develax/razor-pitfalls-semicolon)
