# The overview of Razor-Express

Let's first quickly look at the key concepts and terms.

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
