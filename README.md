# Razor-Express View Template Engine (draft)


When I just started to dive into the world of **Node.js** after years of working with [ASP.NET MVC](https://docs.microsoft.com/en-us/aspnet/core/mvc/overview) I couldn't find any **view template engine** that was as convenient, elegant, concise, and syntactically close to native HTML as [Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/layout). I may be exaggerating its merits and maybe it's all just a matter of habit, but I decided to try to create something similar for **Node.js** & **Express** library. I must say that I was able to find the closest to **Razor** supported library, but some points were quite different from **Razor** which I was used to and they just looked much less concise and convenient to me (like layouts and partial blocks, for example). So, let's proceed to the description of my creation... my first **JavaScript** creation actually.

A quick example
===
Let's first look at the simple example of **Razor-Express markup**, which will allow you to form the first perception, and then we will dive into the details.

In this example we will display all the days of the week and the title. To do this we will create the view markup and the model. 

The **model** is just a *JavaScript object*:

```js
const model = {
    title: "Names of the Days of the Week",
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};
```
The **view** is just a HTML markup mixed with JavaScript syntax (exactly what is called *Razor-like markup* or *Razor-Express*):
```HTML+Razor
<h3>@Model.title</h3>
<ul>
@for(var i = 0; i < Model.days.length; i++){
    var day = Model.days[i];
    <li>@day</li>
}
</ul>
```
How let's compile them together (the view markup is put into `template` variable as a string ):
```js
const parser = require("razor-express").parser("dev");
var html = parser.compileSync({ model, template });
```
...and output the `html` variable value to see the compiled **HTML result**:
```js
console.log(html);
```
Here's what we will see in the console:
```html
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
You can also play with this [live example](https://runkit.com/develax/5bf574e98b71430012d4e641) on **runkit.com**.

----------------------
DRAFT:
----------------------
* `Html.layout` is optional.
* `Html.body` is optional.
* `Html.section` can be called from the `Layout`and any other `View`.
* `@section {...}` can be declared in any `View` including partial views.

* Run tests: npm run testmon
*     "start": "node ./test/server.live.js",
