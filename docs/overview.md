# The overview of Razor-Express View Template Engine

## What is View Tempate and View Template Engine?
Most likely you already know that the [NodeJS](https://nodejs.org/) simplest web server built with [Express library](https://expressjs.com/) can work without any template engine. Express library can just [serve static files](https://expressjs.com/en/starter/static-files.html) in response to a browser request. It can be any staic file including a file with HTML markup (which is essentially a regular text file). Although this method is still quite often used for simple small websites, it contains a number of disadvantages and is not suitable for more complex websites.

The main disadvantage is that your HTML file stores not only the structure of the document but also its data. When the data is mixed with HTML code you can't easily edit the data if you are not familiar with HTML. And when you need to edit HTML you have to wade through tons of text that have nothing to do with HTML itself. This is where the idea of separating *markup* and *data* comes in. 

With this idea of separation, such terms as *"data"* and *"view"* are usually involved. Also, there are another two terms like *"Model"* and *"Model-View"* which mean the same things and typically used in the context of MVC pattern.

So, when the data is stored separately you need some mechanism that can correctly place them in the HTML file. To do this the HTML file should contain special fields or placeholders that have to be replaced with the appropriate data. This file is usually called a *"Template"* or *"View Template"*. And the mechanism which looks for the placeholders and fill them out with data is usually called  *"View Template Engine"*. Different engines [have their differences](https://github.com/DevelAx/RazorExpress/blob/master/README.md#a-brief-comparison-of-syntax-of-nodejs-template-engines) but the basic idea is the same. 

The Razor-Express engine is one of [many](https://github.com/expressjs/express/wiki#template-engines) working with Express. Razor-Express uses [Razor-like syntax](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md) based on the [ASP.NET MVC Razor concept](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) which allows to template your views by mixing HTML markup with real server-side JavaScript code.
