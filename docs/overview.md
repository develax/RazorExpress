# The overview of Razor-Express view template engine

Let's quickly look at the key concepts and terms.

What is View Template?
---
Building an HTML page assumes that you want to display some data on it (what else could it be?). To perform this task, you need the **data** itself and the **page template** (that defines the rules through a special markup language for displaying the data in HTML format). The page template is usually referred to simply as a **"view"** and the data is referred to as a **"view model"** or just **"model"**. So, this is what is usually called *"view templating"*. This consept is used for separating concerns within a web application (for more details [read this](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview)).

What is View Template Engine?
---
A **template engine** allows you to create HTML pages based on the model data and the view template. In other words the engine can understand the view template markup laguage and it also knows how to apply your model data to it to get the HTML page you need.

What is Razor-Express
---
**Razor-Express** is a view template engine which can understand *Razor-like markup language* syntax. Razor-Express is intended to be used with the [Express library](https://expressjs.com/) but it also can be used with any other library or purpose.

> To get more about using template engines with Express read [their guide](https://expressjs.com/en/guide/using-template-engines.html).

Razor-Express syntax reference for NodeJS
---
Razor is a markup syntax for embedding server-based code into webpages based on [ASP.NET Razor syntax](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor). Although I tried to make the Razor-Express syntax as close as possible to [ASP.NET Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) there are some differences that need to be taken into account. 

Just like the *ASP.NET Razor* syntax, the *Razor-Express* syntax consists of Razor-Express markup, JavaScript, and HTML. Files with Razor markup generally have a `.raz` file extension. In fact, the *Razor-Express markup is a normal HTML markup with optionally embedded JavaScript server-side code* to manage that HTML-markup. [Don't be confused with client-side JavaScript](https://stackoverflow.com/a/1404400/1844247) embedded in HTML which is interpreted by *Razor-Express* as part of HTML markup and runs on the client side (in browsers) while Razor-Express' JavaScript runs on the server (in NodeJs).

Since the *Razor-Express* engine must somehow distinguish server-side JavaScript from HTML markup we use the `@` symbol. The `@` just tells the engine's parser that JavaScript server-side code or expression starts after this character. This is the minimum intervention in HTML markup [compared to other existing markup engines](https://github.com/DevelAx/RazorExpress#a-brief-comparison-of-syntax-of-nodejs-layout-engines).

#### The simplest example of Razor-Express markup
```HTML+Razor
@{ 
  var email = "webmaster@example.com";
  var user = "Webmaster";
  var subject = "Hello, " + user + "!";
}
<a href="mailto:@email?Subject=@subject">Send email to @user</a>
```
The rendered HTML by Razor-Express will be:
```HTML
<a href="mailto:webmaster@example.com?Subject=Hello, Webmaster!">Send Email Message to the Webmaster</a>
```
<sup>[^ try this code](https://runkit.com/develax/razor-hello-webmaster)</sup>

#### Escaping `@` character
**Be careful** while using `@` symbol in HTML attributes and content containing **email addresses** since Razor-Express *does* treat the `@` symbol as a transition character and it will cause an error. To escape an `@` symbol in Razor-Express markup, use double `@@`. For example the next Razor-Express markup won't cause any error:
```HTML+Razor
<a href="mailto:webmaster@@example.com">webmaster@@example.com</a>
```
<sup>[^ try this code](https://runkit.com/develax/razor-at-escape)</sup>

Reserved keywords
---
- `Section`

When an `@` symbol is followed by a *Razor-Express reserved keyword*, it transitions into Razor-specific markup. Otherwise, it transitions into plain JavaScript.

Expressions
---
Razor-Express expressions start with `@` followed by JavaScript code:
```HTML+Razor
<p>@Date.now()</p>
```
An expression must not contain spaces and if it does contain you have to enclose such an expression in parentheses:
```HTML+Razor
<p>@(new Date().toLocaleString()</p>
```
<sup>[^ try this code](https://runkit.com/develax/razor-expressions))</sup> 
