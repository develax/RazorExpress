# Razor-Express (RAZ): a view template engine for NodeJS/ExpressJS

<p align="center">
    <a href="https://travis-ci.org/DevelAx/RazorExpress" target="_blank"><img src="https://img.shields.io/travis/DevelAx/RazorExpress.svg?style=plastic" alt="Build Status" /></a>
    <a href="https://www.npmjs.com/package/raz" target="_blank"><img src="https://img.shields.io/node/v/raz.svg?style=plastic" alt="NodeJS Version" /></a>
    <a href="https://www.npmjs.com/package/raz" target="_blank"><img src="https://img.shields.io/npm/v/raz.svg?style=plastic" alt="NPM Version" /></a>
</p>

> <pre>$ npm install <b>raz</b> --save</pre>
> <sup> --> [JavaScript (browser) version](https://www.npmjs.com/package/razjs) of this library.</sup>

- [**Intro**](#intro)
  - [A brief comparison of syntax of Node.JS template engines](#a-brief-comparison-of-syntax-of-nodejs-template-engines)
- [**Quick Start**](#quick-start)
  - [Node.js example](#nodejs-example)
  - [Express web-server example](#express-web-server-example)
- [**Razor-Express API**](/docs/api.md)
- [**The overview of Razor-Express view template engine**](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md)
  - [Views and View Template Engine](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#views-and-view-template-engine)
  - [Rendering layout system](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md#rendering-layout-system)
- [**Razor-Express syntax**](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md)
  - [A simple example](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#a-simple-example-of-razor-express-markup)
  - [Escaping `@` character](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#escaping--character)
  - [Expressions](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#expressions)
  - [Code blocks](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#code-blocks)
  - [Control structures](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#control-structures)
  - [Functions](/docs/syntax.md#functions)
  - [More examples](/docs/syntax.md#more-examples-of-razor-express-syntax)
  - [Reserved keywords](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#reserved-keywords)
    - [`@section`](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#section)
  - [Reserved View objects]()
    - [`debug`](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#debug)
    - [`@Model`](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#view-objects)
    - [`@ViewData`](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#viewdata)
    - [`@Html`](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#html)
  - [Syntax highlighting in code editors](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#syntax-highlighting-in-code-editors)
- [**Common pitfalls & remarks**](#warning-common-pitfalls)
  - [Missing semicolon](#missing-semicolon)
  - [Expressions & code blocks confusion](#expressions--code-blocks-confusion)
- [**Debugging & Errors handling in Razor-Express**](https://github.com/DevelAx/RazorExpress/blob/master/docs/Debugging.md)
- [**Misc**](#misc)
  - [The source code examples](#the-source-code-examples)
  - [TODO list](#todo-list)
-----------------------


Intro
===

When I just started to dive into the world of [Node.js](https://nodejs.org) after years of working with [ASP.NET MVC](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview) I couldn't find any *view template engine* that was as convenient, elegant, concise, and syntactically close to native [HTML](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics) as [ASP.NET MVC Razor syntax](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) was. And when it comes to code it's also syntactically close to the original [C# language](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/). Actually, **ASP.NET MVC Razor markup is a hybrid of HTML markup and C# programming language**. This is exactly what I expected to see in the *NodeJS* world - **a hybrid of HTML and JavaScript**. 

The closest to *Razor* currently supported library for NodeJs & [Express](https://expressjs.com/) I could find was [Vash](https://www.npmjs.com/package/vash). But in some points, it was quite different from *ASP.NET MVC Razor* syntax which I was used to and it just looked much less concise and convenient to me (the syntax for rendering layouts and partial blocks, for example). In short, it did not suit me completely and what's more important I couldn't see its current development. 

A brief comparison of syntax of Node.JS template engines
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
Maybe I'm wrong and this kind of markup really simplifies the development and perception of the code, but to me it doesn't seem to be so. Let's just compare it to the equivalent **Razor markup**:
```HTML+Razor
<div class='item' id='item@item.id'>
  @item.body
</div>
```


I won't go much into all the aspects I don't like in other engines syntax just say that *"[Mustache](https://www.npmjs.com/package/mustache) / [HandleBar](https://handlebarsjs.com/)"*, *"[Pug](https://pugjs.org)"*, and *[Haml](http://haml.info/)* look like I have to learn a new syntax while with *Razor* I virtually know it if I'm already familiar with *HTML* and *JavaScript* languages. [EJS](https://www.npmjs.com/package/ejs) is very close to *Razor* but it is too verbose that makes it difficult to write and read the code.

In these examples I don't compare logic constructions because some of the view engines have logic-less templating syntax.
With Razor you can implement amost any logic that is available with normal JavaScript without learning a new syntax.

Given all the mentioned and unmentioned pros and cons, I decided not to part with Razor-syntax and create something similar for using with [ExpressJS library](https://expressjs.com) (it can work with other frameworks as well). *This library works quite fast since it does not use third-party HTML parsers and regular expressions.*

-----------------------

Quick Start
===

Assuming that you are already familiar with the [basic idea](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md) let's look at a simple example. 

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

As you can see the [*view-template*](/docs/overview.md#views-and-view-template-engine) (or just *view*) is nothing more than *HTML markup mixed with JavaScript syntax*. This is exactly what [Razor-Express syntax](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md) is.

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
...which are pretty much self-explained as we remember what our two components are. Next, we have to render them together using Razor-Express library to get the expected HTML.

```JS
// This code is meant for Node.js 
const razor = require("raz");
var html = razor.render({ model, template });
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
1. [Create a new NodeJS project](https://docs.npmjs.com/creating-a-package-json-file) (set in *server.js* in as an entry point).
2. Install *Express* & *Razor-Express* libraries:
> <pre>$ npm install raz --save</pre>
> <pre>$ npm install express --save</pre>
3. In the project folder create *"server.js"* file (read js-comments inside):

**server.js** file:
```js
// Create Express web server app.
const app = require('express')();
// Register 'Razor' template engine and the default extesnion for the view-template files.
// 'Express' will automatically find the Razor module (within the `node-modules` folder) using this extension. 
// If you decide to skip registering the engine then you will have to explicitly specify the file extension in the route handler.
app.set('view engine', "raz");
// There is an alternative way to register Razor-Express engine (see more in Razor-Express API docs):
//const raz = require('raz');
//raz.register(app);

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

<sup>* The default 'raz' extesnion of view-template files can be changed via the [register](docs/api.md#registerapp-ext) method.</sup>

4. Create the *"views"* folder. This is the directory defined in Express by default where the template files are located. If you want to use another folder you can change it with `app.set('views', './another-views-folder')` method.
5. Create a *view-template* file in that folder named *"index.raz"*. It would have pretty much the same content as in the [previous example](#nodejs-example) except we have to add some basic HTML markup. Notice that the *view-template* file has **'.raz'** extension which every Razor-Express *view* file must have.

**index.raz** file:
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
Now you when run the '**node server.js**' command in the console (or terminal) and open http://localhost:8080/ URL in your browser you will see the HTML page showing something like this:
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

> For a more comprehensive understanding of how the Razor-Express Template Engine works and what Razor-Express syntax is, follow these links:
> * [The overview of Razor-Express template engine](https://github.com/DevelAx/RazorExpress/blob/master/docs/overview.md)
> * [Razor-Express syntax reference for NodeJS & Express](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md)
> * [Using template engines with Express](https://expressjs.com/en/guide/using-template-engines.html)


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

const razor = require("raz");

try{
    var html = razor.render({ template });
}
catch(err){
    console.log(err);
}
```
If you run this code you will get the error:
> RazorError: **The code or section block is missing a closing "}" character.** Make sure you have a matching "}" character for all the "{" characters within this block, and that none of the "}" characters are being interpreted as markup. The block starts at line 3 with text: "@for(var i = 0; i < 10; i++){"

<sup>* [Run this code with RunKit.](https://runkit.com/develax/razor-pitfalls-semicolon)</sup>

Expressions & code blocks confusion
---
Try to stick to simple classical language constructs to avoid ambiguous parser or runtime errors. Although almost all JavaScript syntax is correctly parsed by the engine, some language constructs may not work as you expect. For example, you might try to write a loop as follows:

```HTML+Razor
<table>
  <tr>
    <th>Country</th>
    <th>Area sq.km</th>
  </tr>
  @countries.forEach((c)=>{
    <tr>
      <td>@c.name</td>
      <td>@c.area</td>
    </tr>
  });
</table>
```
There are no syntax errors in this example and the code intuitively looks quite decent. The parser also won't find any problems. However, a runtime error will occur during execution. The actual problem is that the parser considers this statement an expression. When an expression is detected it is evaluated and the return value of it is rendered in HTML. But the parser does look for HTML within expressions. Therefore the HTML tags you put in the expression will cause the runtime error because the whole expression with these tags (as part of JavaScript code) will be tried to be executed.

To make this code work you need to *wrap it explicitly in a code block* then it will be parsed as part of the code block and HTML within it will be rendered correctly. That is, you need to bring it to the following form:
```HTML+Razor
...
@{
    countries.forEach((c)=>{
      <tr>
        <td>@c.name</td>
        <td>@c.area</td>
      </tr>
    });
}
...
```
Another solution would be to use a separate JavaScript function to output HTML. It will be understood by the parser as a block of code and there will be no problem with the [transition to HTML](/docs/syntax.md#transitions-to-html-in-a-function):
```HTML+Razor
...
@function tr(c) {
<tr>
  <td>@c.name</td>
  <td>@c.area</td>
</tr>
}
<table>
  <tr>
    <th>Country</th>
    <th>Area sq.km</th>
  </tr>
  @countries.forEach((c)=>{
    tr(c);
  })
</table>
...
```
<sup>^ [run this example](https://runkit.com/develax/razor-array-foreach)</sup>

However, the best way to avoid such ambiguities is to stick to a plain JavaScript syntax style while writing your view templates. See ["Looping @for, @while, and @do while"](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#looping-for-while-and-do-while) section for examples of loop structures. 

Misc
===

The source code examples
---
Here are the links to all repositories with examples used in the documentation:
- [An example](https://github.com/DevelAx/RazorExpressFullExample) of using some features of the Razor-Express library.
- [An example](https://github.com/DevelAx/RazorExpressExample) from the [Quick-Start](#express-web-server-example) section.
- [An example](https://github.com/DevelAx/RazorExpressErrors) from the [Debugging & Errors handling in Razor-Express](https://github.com/DevelAx/RazorExpress/blob/master/docs/Debugging.md).

<a name="todo-list"></a>
TODO list (Ideas for the next version)
---

1. Implement [Razor-style `@* *@` comments](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md#comments).
2. ~~Make the library available for use on the client side (in the browser).~~([done](https://www.npmjs.com/package/razjs))
3. Implement caching compiled templates.
4. Async partial views.
5. Make `HtmlString` class public for making functions returnin *raw-values* as expessions.
