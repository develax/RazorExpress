# Razor-Express syntax reference for NodeJS & Express
- [**A simple example**](#a-simple-example-of-razor-express-markup)
- [**Escaping `@` character**](#escaping--character)
- [**Expressions**](#expressions)
  - [Expression encoding](#expression-encoding)
  - [Expression raw-rendering](#expression-raw-rendering)
- [**Code blocks**](#code-blocks)
  - [Rendering HTML within JavaScript code blocks](#rendering-html-within-javascript-code-blocks)
- [**Control structures**](#control-structures)
  - [Conditionals: **@if, else if, else, and @switch**](#conditionals-if-else-if-else-and-switch)
  - [Looping: **@for, @while, and @do while**](#looping-for-while-and-do-while)
  - [Exception handling: **@try, catch, finally**](#exception-handling-try-catch-finally)
  - [Comments](#comments)
- [**Reserved keywords**](#reserved-keywords)
  - [@section](#section)

Razor is a markup syntax for embedding server-based code into webpages based on [ASP.NET Razor syntax](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor). Although I tried to make the Razor-Express syntax as close as possible to [ASP.NET Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) there are some differences that need to be taken into account. 

Just like the *ASP.NET Razor* syntax, the *Razor-Express* syntax consists of Razor-Express markup, JavaScript, and HTML. Files with Razor markup generally have a `.raz` file extension. In fact, the *Razor-Express markup is a normal HTML markup with optionally embedded JavaScript server-side code* to manage that HTML. [Don't be confused with client-side JavaScript](https://stackoverflow.com/a/1404400/1844247) embedded in HTML which is interpreted by *Razor-Express* as part of HTML markup and runs on the client side (in browsers) while Razor-Express' JavaScript runs on the server (in NodeJs). For example, it doesn't make any sense to write this code for server-side JavaScript:
```JavaScript
document.getElementsByTagName("body")[0].innerHTML = "<div>This JavaScript will work only in the browser!</div>"
```

Since the *Razor-Express* engine must somehow distinguish server-side JavaScript from HTML markup we use the `@` symbol. The `@` just tells the engine's parser that JavaScript server-side code or expression starts after this character. This is the minimum intervention in HTML markup [compared to other existing markup engines](https://github.com/DevelAx/RazorExpress#a-brief-comparison-of-syntax-of-nodejs-layout-engines).

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
### Expression raw-rendering
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

<sub>* *If you want to share some data among all the request rendering views you can do it either through the `Model` (if there is a single model for all of them) or through the `ViewData` objects.*</sub>


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

### Conditionals @if, else if, else, and @switch
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

A **switch statement** example:
```HTML+Razor
@switch (new Date().getDay()) {
  case 0:
    var day = "Sunday";
    break;
  case 1:
    day = "Monday";
    break;
  case 2:
    day = "Tuesday";
    break;
  case 3:
    day = "Wednesday";
    break;
  case 4:
    day = "Thursday";
    break;
  case 5:
    day = "Friday";
    break;
  case 6:
    day = "Saturday";
}
<strong>Today is @day</strong>
```
<sup>[^ try these code examples](https://runkit.com/develax/razor-conditional-control-structures)</sup>

### Looping @for, @while, and @do while
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


### Exception handling: @try, catch, finally

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


