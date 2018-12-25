[<< Back to start](../README.md)

# Razor-Express syntax reference for NodeJS & Express

- [**A simple example**](#a-simple-example-of-razor-express-markup)
- [**Escaping `@` character**](#escaping--character)
- [**Expressions**](#expressions)
  - [Expression encoding](#expression-encoding)
  - [Raw-rendering](#raw-rendering)
- [**Code blocks**](#code-blocks)
  - [Rendering HTML within JavaScript code blocks](#rendering-html-within-javascript-code-blocks)
- [**Control structures**](#control-structures)
  - [Conditionals: `@if`, `else if`, `else`, and `@switch`](#conditionals-if-else-if-else-and-switch)
  - [Looping: `@for`, `@while`, and `@do while`](#looping-for-while-and-do-while)
  - [Exception handling: `@try`, `catch`, `finally`](#exception-handling-try-catch-finally)
  - [Comments](#comments)
- [**Functions**](#functions)
  - [A standalone function declaration](#a-standalone-function-declaration)
  - [A function rendering raw content](#a-function-rendering-raw-content)
  - [Transitions to HTML in a function](#transitions-to-html-in-a-function)
- [**More examples**](#more-examples-of-razor-express-syntax)
  - [Templating HTML tags & styles](#templating-html-tags--styles)
- [**Reserved keywords**](#reserved-keywords)
  - [`@section`](#section)
- [**View objects**](#view-objects)
  - [`@Model`](#model)
  - [`@ViewData`](#viewdata)
  - [`@Html`](#html)
    - [@Html.layout](#htmllayout)
    - [@Html.body](#htmlbody)
    - [@Html.partial](#htmlpartial)
    - [@Html.encode](#htmlencode)
    - [@Html.raw](#htmlraw)
    - [@Html.getPartial](#htmlgetPartial)
- [**Syntax highlighting in code editors**](#syntax-highlighting-in-code-editors)
    - [Syntax highlighting in Visual Studio Code](#syntax-highlighting-in-visual-studio-code)
  
Razor is a markup syntax for embedding server-based code into webpages based on [ASP.NET Razor syntax](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor). Although I tried to make the Razor-Express syntax as close as possible to [ASP.NET Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) there are some differences that need to be taken into account. 

Just like the *ASP.NET Razor* syntax, the *Razor-Express* syntax consists of Razor-Express markup, JavaScript, and HTML. Files with Razor markup generally have a `.raz` file extension. In fact, the *Razor-Express markup is a normal HTML markup with optionally embedded JavaScript server-side code* to manage that HTML. [Don't be confused with client-side JavaScript](https://stackoverflow.com/a/1404400/1844247) embedded in HTML which is interpreted by *Razor-Express* as part of HTML markup and runs on the client side (in browsers) while Razor-Express' JavaScript runs on the server (in NodeJs). For example, it doesn't make any sense to write this code for server-side JavaScript:
```JavaScript
document.getElementsByTagName("body")[0].innerHTML = "<div>This JavaScript will work only in the browser!</div>"
```

Since the *Razor-Express* engine must somehow distinguish server-side JavaScript from HTML markup we use the `@` symbol. The `@` just tells the engine's parser that JavaScript server-side code or an expression starts after this character. This is the minimum intervention in HTML markup [compared to other existing markup engines](https://github.com/DevelAx/RazorExpress#a-brief-comparison-of-syntax-of-nodejs-layout-engines).

## A simple example of Razor-Express markup
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

## Escaping `@` character
**Be careful** when using `@` symbol in HTML attributes and content containing **email addresses** since Razor-Express *does* treat the `@` symbol as a transition character and it will cause an error. To escape an `@` symbol in Razor-Express markup, use double `@@`. For example the next Razor-Express markup won't cause any error:
```HTML+Razor
<a href="mailto:webmaster@@example.com">webmaster@@example.com</a>
```
<sup>[^ try this code](https://runkit.com/develax/razor-at-escape)</sup>


## Expressions
Razor-Express expressions start with `@` followed by JavaScript code:
```HTML+Razor
<p>@Date.now()</p>
```
An expression must not contain spaces and if it does contain you have to enclose such an expression in parentheses:
```HTML+Razor
<p>@(new Date().toLocaleString()</p>
```
<sup>[^ try this code](https://runkit.com/develax/razor-expressions)</sup> 

### Expression encoding
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
### Raw-rendering
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

> :warning: **Security risk** Using the `Html.raw` method with a user input which might contain malicious JavaScript or other exploits is not safe. Sanitizing user input is not a trivial task, so you'd better avoid using `Html.raw` with user input.

It's also possible to render *raw text* directly to the HTML in your own functions with Razor-Express syntax (see [A function rendering raw content](#a-function-rendering-raw-content) section).

## Code blocks
*Razor-Express code blocks* start with `@` symbol just like *expressions*. But unlike expressions code blocks are enclosed by `{}` and JavaScript code result inside code blocks isn't rendered (unless you do it explicitly via `Html.render` or other methods). 

Code blocks and expressions share the same scope which is limited to one compiled view template. This means that a normal view and a partial view that is rendered within that view have different scopes. Although a normal view compiled template also includes `_viewStart.raz` templates if they exists. Any section's sope is the scope of its view. That is, any variable value calculated in a code block as well as any other JavaScript language definition is available within that's view scope later in expressions or other code blocks:

```HTML+Razor
@{
  var currentYear = new Date().getFullYear();
}
<div>
  <!-- These expressions use data from this view's scope. -->
  The current year is @currentYear.
</div>
```

The browser will show:

<pre>
The current year is 2018. It is not a leap year.
</pre>
<sup>[^ try this code](https://runkit.com/develax/razor-code-blocks)</sup> 

### Rendering HTML within JavaScript code blocks
To render an HTML code within JavaScript code block you can either use implicit transitions or the `Html` object methods.

#### Transitions to HTML
The default language in a code block is JavaScript, but the Razor-Express engine can transition back to HTML:

```HTML+Razor
@{
    var js = "JavaScript";
    <p>Now in <b>HTML</b>, was in <b>@js</b>.</p>
    Html.raw("<p>This <b>HTML</b> line is rendered via <b>Html.raw</b> method.</p>");
    Html.encode("<p>This <b>HTML</b> line is rendered via <b>Html.raw</b> method.</p>");
}
```
The browser output would be:
<pre><p>Now in <b>HTML</b>, was in <b>JavaScript</b>.</p>
<p>This <b>HTML</b> line is rendered via <b>Html.raw</b> method.</p>&lt;p&gt;This &lt;b&gt;HTML&lt;/b&gt; line is rendered via &lt;b&gt;Html.raw&lt;/b&gt; method.&lt;/p&gt;</pre>
<sup>[^ try this code](https://runkit.com/develax/razor-code-blocks-transitions-to-html)</sup> 

*Notice that in code blocks after the HTML line you continue writing JavaScript without explicit transitioning to it via `@` symbol.*

## Control structures
Control structures are just an extension of code blocks. All aspects of code blocks also apply to the JavaScript structures: `{}` are required and the `@` symbol is placed only at the beginning of the structure. 

### Conditionals `@if`, `else if`, `else`, and `@switch`
In the next example there are a code block and a control structure:

```HTML+Razor
@{
  var year = new Date().getFullYear();
}
<div>
  @if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0){
    <strong>@year is a leap year.</strong>
  }
  else{
    <strong>@year is not a leap year.</strong>
  }
</div>
```
Rendered HTML:
```HTML
<div>
    <strong>2018 is not a leap year.</strong>
</div>
```
As you can see once you put the `@` character at the beginning of `if` statement, you don't need to repeat it for `else` or `else if`.

The same could be written a little differently:
```HTML+Razor
<div>
  @{
    var year = new Date().getFullYear();
    
    if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0){
        <strong>@year is a leap year.</strong>
    }
    else{
        <strong>@year is not a leap year.</strong>
    }
  }
</div>
```

A `switch` statement example:
```HTML+Razor
<span>Today is 
@switch (new Date().getDay()) {
  case 0:
    <strong>Sunday</strong>
    break;
  case 1:
    <strong>Monday</strong>
    break;
  case 2:
    <strong>Tuesday</strong>
    break;
  case 3:
    <strong>Wednesday</strong>
    break;
  case 4:
    <strong>Thursday</strong>
    break;
  case 5:
    <strong>Friday</strong>
    break;
  case 6:
    <strong>Saturday</strong>
    break;
}
</span>
```
<sup>[^ try these code examples](https://runkit.com/develax/razor-conditionals-if-else-switch)</sup>

### Looping `@for`, `@while`, and `@do while`
You can use looping control statements to render a templated HTML. In the following examples, we will use different kinds of loops to render a list of countries. 

```JavaScript
const countries = [
 { name: "Russia", area: 17098242 },
 { name: "Canada", area: 9984670 },
 { name: "United States", area: 9826675 },
 { name: "China", area: 9596960 },
 { name: "Brazil", area: 8514877 },
 { name: "Australia", area: 7741220 },
 { name: "India", area: 3287263 }
];
```

#### `@for`
```HTML+Razor
<table>
  <tr>
    <th>Country</th>
    <th>Area sq.km</th>
  </tr>
  @for(var i = 0; i < countries.length; i++){
    var country = countries[i];
    <tr>
      <td>@country.name</td>
      <td>@country.area</td>
    </tr>
  }
</table>
```

#### `@while`
```HTML+Razor
<table>
  <tr>
    <th>Country</th>
    <th>Area sq.km</th>
  </tr>
  @{ var i = 0; }
  @while(i < countries.length){
    var country = countries[i++];
    <tr>
      <td>@country.name</td>
      <td>@country.area</td>
    </tr>
  }
</table>
```

#### `@do while`
```HTML+Razor
@do{
  var country = countries[i++];
  <tr>
    <td>@country.name</td>
    <td>@country.area</td>
  </tr>
}while(i < countries.length)
```
<sup>[^ try these code examples](https://runkit.com/develax/razor-looping-structures)</sup>

#### `@Array.prototype.forEach`
Using `forEach` structure for looping an array is not recommended. An example of using `forEach` with explanations is given in the ["Expressions & code blocks confusion"](https://github.com/DevelAx/RazorExpress/blob/master/README.md#expressions--code-blocks-confusion) section.


### Exception handling: `@try`, `catch`, `finally`

```HTML+Razor
@try {
    <div>------- User Info --------</div>
    <div>
        User id: @user.id
        <br/>
        User name: @user.name
    </div>
}
catch (exc) {
    <span>Error: @exc</span>
    Html.raw("    </div>\\n");// to maintain the integrity of the HTML after the exception
}
finally {
    <div>------- The End --------</div>
}
```
HTML output:
```HTML
<div>------- User Info --------</div>
<div>
    User id:     <span>Error: ReferenceError: user is not defined</span>
</div>
<div>------- The End --------</div>
```
<sup>[^ try this example](https://runkit.com/develax/razor-exception-handling)</sup>

### Comments
In Razor-Express HTML & JavaScript comments are used in the usual way: just use HTML comments for HTML markup and JavaScript comments for JavaScript code.
```HTML+Razor
@{
    /* JavaScript comment */
    // Another JavaScript comment
}
<!-- HTML comment -->
```
The rendered HTML:
```HTML
<!-- HTML comment -->
```
<sup>[^ try this example](https://runkit.com/develax/razor-comments)</sup>

*The current Razor-Express version doesn't support universal comments for the Razor Razor-Express markup.* So, if you try `@* *@` from ASP.NET MVC Razor it wouldn't work.

### Functions

#### A standalone function declaration
A standalone function declaration is merely a special case of a [*code block*](#code-blocks).

Let's take [this example](#conditionals-if-else-if-else-and-switch) and modify it so that the calculations are performed in a separate function.

```HTML+Razor
@function isLeapYear(year){
  return year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
}
<div>
  @{ 
    var year = new Date().getFullYear();
    
    if (isLeapYear(year)){
      <span>@year <strong>is</strong> a leap year</span>
    }
    else{
      <span>@year <strong>is not</strong> a leap year</span>
    }
  }
</div>
```
or the same example slightly modified:
```HTML+Razor
@function isLeapYear(year){
  return year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
}
<div>
  @{ 
    var year = new Date().getFullYear();
    var html = \`<span>\${year} <strong>\${isLeapYear(year) ? "is" : "is not"}</strong> a leap year</span>\`;
  }
  @Html.raw(html);
</div>
```
#### A function rendering raw content
```HTML+Razor
@function isLeapYear(year) {
  return year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
}
@function renderYearInfo() {
    var year = new Date().getFullYear();
    var html = \`<span>\${year} <strong>\${isLeapYear(year) ? "is" : "is not"}</strong> a leap year</span>\`;
    Html.raw(html);
}
<div>
  @renderYearInfo()
</div>
```
#### Transitions to HTML in a function
Because a function is a special case of a code block it's also possible to make [transitions from code to HTML](#transitions-to-html) within it. Let's modify our example one time more again:
```HTML+Razor
@function isLeapYear(year) {
  return year % 4 == 0 && year % 100 != 0 || year % 400 == 0;
}
@function renderYearInfo() {
    var year = new Date().getFullYear();
    <span>@year <strong>@(\`\${isLeapYear(year) ? "is" : "is not"}\`)</strong> a leap year</span>
}
<div>
  @renderYearInfo()
</div>
```
The result for all these examples will be the same:
<pre>
2018 <strong>is not</strong> a leap year
</pre>
<sup>[^ try these examples](https://runkit.com/develax/razor-function)</sup>

> :warning: **Arrow functions** work as well but they should be used with caution because they can be regarded by Razor-Express as an expression, not a block of code (see [*"Expressions & code blocks confusion"*](../README.md#expressions--code-blocks-confusion)).

## More examples of Razor-Express syntax

### Templating HTML tags & styles
With the Razor-Express engine, you can template not only the content of the page but the markup elements themselves, such as tags, styles, attributes, etc. 

```HTML+Razor
@{
    var size = "50px";
}
@function randomInt(max) {
  return Math.floor(Math.random() * Math.floor(max + 1));
}
@function drawBox() {
    var x = randomInt(1);
    var tag = x ? "div" : "span";
    <@tag class="box">@tag</@tag>
}
@for(var i = 0; i < 5; i++){
    drawBox();
}
<style>
 .box { 
    width:@size; 
    height:@size; 
    display: table-cell; 
    vertical-align: middle; 
    text-align: center;
    border:1px solid black;
 }
 span { background-color: lightblue; }
 div { background-color: yellow; }
</style>
```
Result:
```HTML
<span class="box">span</span>
<div class="box">div</div>
<span class="box">span</span>
<span class="box">span</span>
<span class="box">span</span>
<style>
 .box { 
    width:50px; 
    height:50px; 
    display: table-cell; 
    vertical-align: middle; 
    text-align: center;
    border:1px solid black;
 }
 span { background-color: lightblue; }
 div { background-color: yellow; }
</style>
```
<sup>[^ live example](https://runkit.com/develax/razor-tags)</sup>

## Reserved keywords
- `@section`

When an `@` symbol is followed by a *Razor-Express reserved keyword*, it transitions into Razor-specific markup. Otherwise, it transitions into plain JavaScript.

### `@section`
Sections are used to organize where certain page elements should be placed within the parent layout or within the same layout. For example, if you want some block of the Razor-Express markup from any rendered view to be placed in a specific place of the layout view, you can define a named section in your view and then define a reference to this section at that specific place of the layout. 

Let's give a markup example:

**`index.raz`** view
```HTML+Razor
<link href="/css/site.css" rel="stylesheet" />
<h1>Home Page</h1>
```

**`_layout.raz`** layout view
```HTML+Razor
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
   @Html.body()
</body>
</html>
```

After this code is compiled you will get the next HTML:
```HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <link href="/css/site.css" rel="stylesheet" />
  <h1>Home Page</h1>
</body>
</html>
```
This may not suit you completely because the link to the `css` file has been placed in the `<body>` but you might want it to be in the `<head>`. That's what the sections are for! To fix it you should define a section in the `index.raz`:

**`index.raz`** view
```HTML+Razor
<h1>Home Page</h1>
@section Styles {
    <link href="/css/site.css" rel="stylesheet" />
}
```
In this case, the section name is 'Styles'. In fact, you can place the definition of the section anywhere you want within the `index.raz` view since it will be rendered only in the `_layout.raz` layout. For that, you have to reference that section by its name in the `_layout.raz` layout: 

**`_layout.raz`** layout view
```HTML+Razor
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    @Html.section("Styles")
</head>
<body>
   @Html.body()
</body>
</html>
```
This time you will get the following HTML:

```HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="/css/site.css" rel="stylesheet" />
</head>
<body>
  <h1>Home Page</h1>
</body>
</html>
```
The css `<link>` is placed in the `<head>` - exactly what you wanted.

Each call to `@Html.section` specifies a section name as the first parameter and whether that section is required or optional as the second one:
```HTML+Razor
@Html.section("Scripts", true)
```
If a required section isn't found, an exception is thrown. Individual views specify the content to be rendered within a section using the `@section{...}` Razor syntax. If a page or view defines a section, it must be rendered (or an error will occur). An example of `@section` definition:
```HTML+Razor
@section Scripts {
    <script type="text/javascript" src="/scripts/site.js"></script>
}
```
In the preceding code, *"/scripts/site.js"* is added to the scripts section on a page. Other pages in the same app might not require this script and wouldn't define a scripts section. Sections defined in a page are available in its layout page or parent page for partials views. 

**NOTE:** In *ASP.NET MVC Razor* only the immediate layout page can render a section and they cannot be referenced from partial views. In the current implementation of *Razor-Express* we don't have this limitation. I can't see anything wrong with having some specific script or style in some partial view to be placed in a section. Since partial views can be rendered on a page more than once, each its section is rendered only once. Also, you can have different sections defined in different files (views) with the same name. Then the `@Html.section` method will render all these sections in one specific place. Of course, you should take into account that the order in which the sections will be rendered corresponds to the rendering order of the views, partial views, and layouts. Sections can be defined and rendered even within the same (one) view, in this case the order is also important: definition must go before the reference.

## View objects
The following objects are available to server-side JavaScript code in a *view template*:
* `Model`
* `ViewData`
* `Html`

### @Model
The *model* is meant to pass some data from the router<sup>[1](#ref1)</sup> to the *view* (see [Express web-server example](/README.md#express-web-server-example)) where it is represented by the `Model` object and used via Razor-Express syntax to display some data to a user. It can contain either pure data or data and methods that operate on this data. The *view* depends on the *model*, but the *model* should not have any dependencies.

### @ViewData
*ViewData* is the object to which all the *view templates* involved in the building the page have access to. One view can pass some data through this object to another view (to the layout, for example) taking into account [the order of processing views](overview.md#the-order-of-processing-views).

### @Html
`Html` object provides several methods and propertis for compiling the page rendering HTML which are used within its *view template*:
* Html.layout
* Html.body
* Html.partial
* Html.encode
* Html.raw
* Html.getPartial

#### `Html.layout`
Specifies a *layout* for the *view template*, example:
```HTML+Razor
@{
    Html.layout = "_layout";
}
```

<sup>* also see the ["Layouts"](overview.md#layouts) section</sup>

#### `Html.body`
Renders the contents of the view in the layout.
```HTML+Razor
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

<sup>* also see the ["Layouts"](overview.md#layouts) section</sup>

#### `Html.partial`
Renders content of the partial view in a view, layout or another partial view.
As an expression
```HTML+Razor
<div>@Html.partial("_userForm")</div>
```
or as a code-block:
```HTML+Razor
@if(Model.showUserForm){
    Html.partial("_userForm");
}
```

<sup>* also see the ["Partial views"](overview.md#partial-views) section</sup>

#### `Html.encode`
HTML encodes values and then renders it in a view.
```HTML+Razor
<div>@Html.encode("<span>Hello World</span>")</div>
```
This is equivalent to wrapping the string into [the expression](#expressions):
```HTML+Razor
<div>@("<span>Hello World</span>")</div>
```
The resulting HTML will be no different from the previous one.

<sup>* also see the ["Expression encoding"](#expression-encoding) section</sup>

#### `Html.raw`
Renders a string to HTML without encoding.
```HTML+Razor
<span>@Html.raw("This is an example of <b>bold text</b>.")</span>
```
<sup>* also see the ["Raw rendering"](#raw-rendering) section</sup>

#### `Html.getPartial`
Returns a partial view as a string (not HTML encoded).
```HTML+Razor
@{
  var userFormHtml = (Model.showUserForm) ? Html.getPartial("_userForm") : null;
}
@Html.raw(userFormHtml)
```

<sup>* also see the ["Partial views"](overview.md#partial-views) section</sup>

## Syntax highlighting in code editors
To turn on Razor-Express syntax highlighting in your code editor create an association for files with the `'raz'` extension to the *ASP.NET MVC Razor* syntax. In most cases, this will be enough to have a pretty good Razor-Express syntax highlighting. Some code editors may require a plugin to support Razor syntax highlighting. If so, just search and install this kind of plugin for the *ASP.NET MVC Razor* syntax and associate it with the `raz` extension.

### Syntax highlighting in Visual Studio Code
To turn on syntax highlighting for Razor-Express in [Visual Studio Code](https://code.visualstudio.com/) go to **`File` > `Preferences` > `Settings`** or use the [**`Ctrl`+`,`**] / [**`Cmd`+`,`**] shortcut:

![Visual Studio Code: path to Settings](./syntax/VSC-path-to-Settings.jpg?raw=true)

Having the *"Settings editor"* open, go to **`Text Editor` > `Files` > `Association`**:

![Visual Studio Code: Settings](syntax/VSC-Settings.jpg?raw=true)

Then click on **"Edit in settings.json"** to open it in a text editor:

In the **"USER SETTINGS"** tab find the parameter `"files.associations"` or create it and add the `"*.raz": "cshtml"` key-value pair to it: 

![Visual Studio Code: editing the "file-associations" parameter](syntax/VSC-user-settings-tab.jpg?raw=true)

The Razor-Express syntax in Visual Studio Code is now being highlighted. 




--------------------

<sub>
<a name="ref1"></a> 
1. ASP.NET MVC uses the concept of *"Controller" what is virtually the same as "Router" in Express.
</sub>
