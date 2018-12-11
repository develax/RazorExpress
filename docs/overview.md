# The overview of Razor-Express View Template Engine

- [**What is View Tempate and View Template Engine**](#what-is-view-tempate-and-view-template-engine)
- [**Views rendering and Layout system in Razor-Express**](#views-rendering-and-layout-system-in-razor-express)
  - [Processing a view template](#processing-a-view-template)
    - [The views processing order](#the-views-processing-order)
  - [Layouts](#layouts)
  - [Partial views](#partial-views)
  - [Partial view search algorithm](#partial-view-search-algorithm)

## What is View Tempate and View Template Engine?
Most likely you already know that the simplest [NodeJS](https://nodejs.org/) web server built with [Express library](https://expressjs.com/) can work without any template engine. Express library can just [serve static files](https://expressjs.com/en/starter/static-files.html) in response to a browser request. It can be any staic file including a file with HTML markup (which is essentially a regular text file). Although this method is still quite often used for simple small websites, it contains a number of disadvantages and is not suitable for more complex websites.

The main disadvantage is that your HTML file stores not only the structure of the document but also its data. When the data is mixed with HTML code you can't easily edit the data if you are not familiar with HTML. And when you need to edit HTML you have to wade through tons of text that have nothing to do with HTML itself. This is where the idea of separating *markup* and *data* comes in. 

With this idea of separation, such terms as *"data"* and *"view"* are usually involved. Also, there are another two terms like *"Model"* and *"Model-View"* which mean the same things and typically used in the context of MVC pattern.

So, when the data is stored separately you need some mechanism that can correctly place them in the HTML file. To do this the HTML file should contain special fields or placeholders that have to be replaced with the appropriate data. This file is usually called a *"Template"* or *"View Template"*. And the mechanism which looks for the placeholders and fill them out with data is usually called  *"View Template Engine"*. Different engines [have their differences](https://github.com/DevelAx/RazorExpress/blob/master/README.md#a-brief-comparison-of-syntax-of-nodejs-template-engines) but the basic idea is the same. 

The Razor-Express engine is one of [many](https://github.com/expressjs/express/wiki#template-engines) working with Express. Razor-Express uses [Razor-like syntax](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md) based on the [ASP.NET MVC Razor concept](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) which allows to template your views by mixing HTML markup with real server-side JavaScript code.

## Views rendering and Layout system in Razor-Express
When you have a *NodeJS Express web app* set up (an example is [here](https://github.com/DevelAx/RazorExpress/blob/master/README.md#express-web-server-example)) and run the Express framework starts to use the Razor-Express Engine as a service to read the *view templates* and process them into HTML. This happens as follows:

1. The app receives a request from the browser.
2. The Express application analyzes the request URL and finds an appropriate route which determines a file to return in response to the browser request. 
3. Express makes sure that the file actually exists and then transfers control to the Razor-Express engine. Also the Express can pass some data (or model) to the engine to render it with that HTML-template file content.
4. Razor-Express reads this template file, renders HTML, and returns it back to Express.
5. Having control back the library sends that HTML to the browser.

This is a very simplified description of the request handling to understand the role of the Razor-Express engine in this process. Now let's take a closer look at what happens in the Razor-Express engine while processing the *view template* and *data*.

### Processing a view template
When the Razor-Express gets to control, it also gets the full filename of the template and the data model passed as parameters. The data model is optional. In case of success the engine returns HTML. If a failure occurs while reading, parsing, or rendering the file template it returns an error. At this stage, its work ends.

After the file is found and read, the engine tries to find all files *"_viewStart.raz"* following the [partial views standard search algorithm logic](#partial-view-search-algorithm). If they are found they are added to the current file from its beginning in the order the search sequence (each next found is added to the very beginning of the current file and so on).

When this process is finished the parser starts analyzing the resulting template. It's worth noting that *the parser doesn't trying to fully analyze the validity of its HTML*. For example, it is not much concerned about mistakes in the attributes of the HTML tags. It only checks the integrity of the HTML tag tree and extracts snippets of the JavaScript control code.

After parsing is done the execution process begins. At this point, the template placeholders are substituted with the appropriate values from the data model and all the server-side JavaScript code found in this template is executed. In this process, the references to other view templates could be found. If so, each referenced template file is read and processed the same way as the main view (with which the engine has started) with the exception that the *"_viewStart.raz"* files are not considered anymore. Each referenced template file is processed separately from the main one and from the others. This means that if you declare a variable in one template it won't be available in any referenced template because each processed file is run in its own scope (and in its own moment). If you need to share some data between those views it is possible to do as will be discussed later. However, the data model is the same for all of them by default (unless it's explicitly set otherwise).

There are two types of view templates, which can be explicitly referenced from the rendering page template:
1. Partial view
2. Layout

> :warning: It's worth emphasizing once again that *only a page template is processed together with starting template* as one whole template (they are joined before being parsed and executed). All other templates are parsed and executed separately, and only then included in each other in the form of ready-made HTML.

#### The views processing order

*The order in which views are processed is also important to remember* in case you decide to change some data in the model, for example, in one view and then use it in another. The **main template** with all the start views are processed first, as you already know. Then the **layout** (of that view) is processed. And only then all **partial views** are processed in the order they are referenced. 
Actually, it is not different from *ASP.NET MVC Razor*.

### Layouts
Layout is a common markup for a group of site pages that have some common elements, such as header, footer, menu, as well as other structures such as scripts, stylesheets, etc. Using layouts helps to reduce duplicate code in views. From the *Razor-Express engine* point of view, a layout is just a normal view template with the only difference being that the layout defines a top level template for other views. Using the layout is optional. Apps can define more than one layout, with different views specifying different layouts. A layout can have a reference to another layout and so forth which means that layouts can be nested (see an example [here](https://github.com/DevelAx/RazorExpressFullExample)). Layouts can have references to partial views as well.

Conventionally the default layout is named *"_layout.raz"*. To specify a layout for a view an `Html.layout` property must be set in that view:
```HTML+Razor
@{
    Html.layout = "_layout";
}
```
You can use either a partial name like in the example above or a full path:
```HTML+Razor
@{
    Html.layout = "/admin/_layout";
}
```
The layout file extension is optional in both cases. When a partial name is provided, the Razor-Express view engine searches for the layout file using its standard for [partial views discovery process](#partial-view-search-algorithm).

Each layout is supposed to call `@Html.body()` within itself where the contents of the current view have to be rendered. (As you remember, the page template is processed before the layout template, so this call renderers an already compiled page template.) 

### Partial views
The term *"partial view"* clearly implies that HTML received as a result of processing this partial view template will become a part of the page view which has a reference to it. Partial view can have a reference to other partial views, but it _can't have a reference to a layout_.

Partial views are supposed to reuse the same code snippets from different views thus avoiding duplication. Also there is an advantage split large, complex markup file into sereveral logical pieces and work with each piece isolated within a partial view. 

By convention, partial view file names begin with an underscore (`_`). It's not strictly required, although it helps to visually differentiate them from page views.

To reference a partial view from any view use `Html.partial` method:
```HTML+Razor
@Html.partial("_partial")
```
This method initiates a search procedure using [partial views search algorithm](#partial-view-search-algorithm).

### Partial view search algorithm

* If a partial view is specified *only by a file name* with or without an extension (as in the [Partial views section](#partial-views) example above) then the search begins with the directory in which the view that initiates the search is located. If the partial view is not found in the current directory the search goes on up the directory tree until it reaches the root views folder specified in the [Express app](https://expressjs.com/en/guide/using-template-engines.html) (which is set as `app.set('views', './views')` by default). If the file is still not found an error is returned.
* In the case where the *full path relative to the root views directory* is specified the file will be searched only in this directory. Never include the views root folder name in the full path!
* To make the search take place *only in the current directory*, use the the form `'./_partialView'`.

Different partial views with the same file name are allowed when the partial views are in different folders.

Partial views can be chained — a partial view can call another partial view and so on(be careful not to create circular references).

