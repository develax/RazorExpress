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
Razor is a markup syntax for embedding server-based code into webpages based on [ASP.NET Razor syntax](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor). Although I tried to make the Razor-Express syntax as close as possible to [ASP.NET Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) there are some differences that need to be taken into account. Just like the *ASP.NET Razor* syntax, the *Razor-Express* syntax consists of Razor-Express markup, JavaScript, and HTML. Files with Razor markup generally have a `.raz` file extension. In fact, the *Razor-Express markup is HTML markup with embedded JavaScript server-side code* to manage that HTML-markup. [Don't be confused with client-side JavaScript](https://stackoverflow.com/a/1404400/1844247) embedded in HTML which is interpreted by *Razor-Express* as part of HTML markup and runs on the client side (in browsers) while Razor's JavaScript runs on the server (in NodeJs).
