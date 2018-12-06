# The overview of Razor-Express View Template Engine
Let's look quickly at the key concepts and terms.

- [**What is View Template?**](#what-is-view-template)
- [**What is View Template Engine?**](#what-is-view-template-engine)
- [**What is Razor-Express?**](#what-is-razor-express)
- [**Razor-Express syntax**](#razor-express-syntax-reference-for-nodejs)
  - [Reserved keywords](#reserved-keywords)
  - [A simple example](#a-simple-example-of-razor-express-markup)
  - [Escaping `@` character](#escaping--character)
  - [Expressions](#expressions)
    - [Expression encoding](#expression-encoding)
    - [Expression raw-rendering](#expression-raw-rendering)

## What is View Template?
Building an HTML page assumes that you want to display some data on it (what else could it be?). To perform this task, you need the **data** itself and the **page template** (that defines the rules through a special markup language for displaying the data in HTML format). The page template is usually referred to simply as a **"view"** and the data is referred to as a **"view model"** or just **"model"**. So, this is what is usually called *"view templating"*. This consept is used for separating concerns within a web application (for more details [read this](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview)).

## What is View Template Engine?
A **template engine** allows you to create HTML pages based on the model data and the view template. In other words the engine can understand the view template markup laguage and it also knows how to apply your model data to it to get the HTML page you need.

## What is Razor-Express?
**Razor-Express** is a view template engine which can understand *Razor-like markup language* syntax. Razor-Express is intended to be used with the [Express library](https://expressjs.com/) but it also can be used with any other library or purpose.

> To get more about using template engines with Express read [their guide](https://expressjs.com/en/guide/using-template-engines.html).

## Razor-Express syntax reference for NodeJS
Razor is a markup syntax for embedding server-based code into webpages based on [ASP.NET Razor syntax](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor). Although I tried to make the Razor-Express syntax as close as possible to [ASP.NET Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) there are some differences that need to be taken into account. 

Just like the *ASP.NET Razor* syntax, the *Razor-Express* syntax consists of Razor-Express markup, JavaScript, and HTML. Files with Razor markup generally have a `.raz` file extension. In fact, the *Razor-Express markup is a normal HTML markup with optionally embedded JavaScript server-side code* to manage that HTML-markup. [Don't be confused with client-side JavaScript](https://stackoverflow.com/a/1404400/1844247) embedded in HTML which is interpreted by *Razor-Express* as part of HTML markup and runs on the client side (in browsers) while Razor-Express' JavaScript runs on the server (in NodeJs).

Since the *Razor-Express* engine must somehow distinguish server-side JavaScript from HTML markup we use the `@` symbol. The `@` just tells the engine's parser that JavaScript server-side code or expression starts after this character. This is the minimum intervention in HTML markup [compared to other existing markup engines](https://github.com/DevelAx/RazorExpress#a-brief-comparison-of-syntax-of-nodejs-layout-engines).

### Reserved keywords

- `Section`

When an `@` symbol is followed by a *Razor-Express reserved keyword*, it transitions into Razor-specific markup. Otherwise, it transitions into plain JavaScript.

### A simple example of Razor-Express markup
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

### Escaping `@` character
**Be careful** when using `@` symbol in HTML attributes and content containing **email addresses** since Razor-Express *does* treat the `@` symbol as a transition character and it will cause an error. To escape an `@` symbol in Razor-Express markup, use double `@@`. For example the next Razor-Express markup won't cause any error:
```HTML+Razor
<a href="mailto:webmaster@@example.com">webmaster@@example.com</a>
```
<sup>[^ try this code](https://runkit.com/develax/razor-at-escape)</sup>


### Expressions
Razor-Express expressions start with `@` followed by JavaScript code:
```HTML+Razor
<p>@Date.now()</p>
```
An expression must not contain spaces and if it does contain you have to enclose such an expression in parentheses:
```HTML+Razor
<p>@(new Date().toLocaleString()</p>
```
<sup>[^ try this code](https://runkit.com/develax/razor-expressions)</sup> 

#### Expression encoding
JavaScript expressions are converted to a string by `.toString` and HTML encoded before they're rendered. 
The next code:
```HTML+Razor
@("<strong>Hello Developer!</strong>")
```
renders the following HTML:
```HTML
&lt;strong&gt;Hello Developer!&lt;/strong&gt;
```
and the browser will show it with tags as:
```
<strong>Hello Developer!</strong>
```
#### Expression raw-rendering
If you don't want the expression to be encoded use `Html.raw` method:
```HTML+Razor
@Html.raw("<strong>Hello Developer!</strong>")
```
It will render the HTML *"as it is"*:
```HTML
<strong>Hello Developer!</strong>
```
and the browser displays it without tags as just:
<pre>
<b>Hello Developer!</b>
</pre>
<sup>[^ try this code](https://runkit.com/develax/razor-expression-encoding)</sup> 

> :warning: Using the `Html.raw` method with a user input which might contain malicious JavaScript or other exploits is a **security risk**. Sanitizing user input is not a trivial task, so you'd better avoid using `Html.raw` with user input.

### Code blocks
*Razor-Express code blocks* start with `@` symbol just like *expressions*. But unlike expressions code blocks are enclosed by `{}` and JavaScript code result inside code blocks isn't rendered (unless you do it explicitly via `Html.render` or other methods). 

Code blocks and expressions share the same scope which is limited to one compiled view template. This means that a normal view and a partial view that is rendered within that view have different scopes. Although a normal view compiled template also includes `_viewStart.raz` templates if they exists. Any section's sope is the scope of its view. If you need to share data among all the rendered views you can do it through the `Model` (if there is a signle model for all of them) or through the `ViewData` objects. Nothing except the data can be shared among views with different scopes.



