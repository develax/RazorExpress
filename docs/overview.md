# The overview of Razor-Express View Template Engine

- [**What is View Tempate and View Template Engine?**](#)f
- [**Views rendering and Layout system in Razor-Express**](#)

## What is View Tempate and View Template Engine?
Most likely you already know that the [NodeJS](https://nodejs.org/) simplest web server built with [Express library](https://expressjs.com/) can work without any template engine. Express library can just [serve static files](https://expressjs.com/en/starter/static-files.html) in response to a browser request. It can be any staic file including a file with HTML markup (which is essentially a regular text file). Although this method is still quite often used for simple small websites, it contains a number of disadvantages and is not suitable for more complex websites.

The main disadvantage is that your HTML file stores not only the structure of the document but also its data. When the data is mixed with HTML code you can't easily edit the data if you are not familiar with HTML. And when you need to edit HTML you have to wade through tons of text that have nothing to do with HTML itself. This is where the idea of separating *markup* and *data* comes in. 

With this idea of separation, such terms as *"data"* and *"view"* are usually involved. Also, there are another two terms like *"Model"* and *"Model-View"* which mean the same things and typically used in the context of MVC pattern.

So, when the data is stored separately you need some mechanism that can correctly place them in the HTML file. To do this the HTML file should contain special fields or placeholders that have to be replaced with the appropriate data. This file is usually called a *"Template"* or *"View Template"*. And the mechanism which looks for the placeholders and fill them out with data is usually called  *"View Template Engine"*. Different engines [have their differences](https://github.com/DevelAx/RazorExpress/blob/master/README.md#a-brief-comparison-of-syntax-of-nodejs-template-engines) but the basic idea is the same. 

The Razor-Express engine is one of [many](https://github.com/expressjs/express/wiki#template-engines) working with Express. Razor-Express uses [Razor-like syntax](https://github.com/DevelAx/RazorExpress/blob/master/docs/syntax.md) based on the [ASP.NET MVC Razor concept](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor) which allows to template your views by mixing HTML markup with real server-side JavaScript code.


## Views rendering and Layout system in Razor-Express
When you have a *NodeJS Express web app* set up (an example is [here](https://github.com/DevelAx/RazorExpress/blob/master/README.md#express-web-server-example)) and run the Express framework starts to use the Razor-Express Engine as a service to read the *view templates* and process them into HTML. This happens as follows:

1. Your app receives a request from the browser.
2. The Express application analyzes the request URL, finds an appropriate route which determines the file to return in response to the browser request. 
3. Express makes sure that the file actually exists and then transfers control to the Razor-Express engine. Also the Express can pass some data (or model) to the engine to render it with that HTML-template file content.
4. Razor-Express reads this template file, renders HTML, and returns it back to Express.
5. Having control back the library sends that HTML to the browser.

This is a very simplified description of the request handling to understand the role of the Razor-Express engine in this process. Now let's take a closer look at what happens in the Razor-Express engine while processing the *view template* and *data*.

### Processing a view template
When the Razor-Express gets to control, it also gets the full filename of the template and the data model passed as parameters. The data model is optional. In case of success the engine returns HTML. If a failure occurs while reading, parsing, or rendering the file template it returns an error. At this stage, its work ends.

After the file is found and read, the parser starts to analyze it. It's worth noting that the parser is not trying to fully analyze the validity of HTML. For example, it is not much concerned about mistakes in the attributes of the HTML tags. It only checks the integrity of the HTML tag tree and extracts snippets of the JavaScript control code.




