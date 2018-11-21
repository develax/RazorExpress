# Razor-Express view template engine (draft)


When I just started to dive into the world of Node.js after years of working with ASP.NET MVC I couldn't find any view template engine that was as convenient, elegant, concise, and syntactically close to native HTML as [Razor](https://docs.microsoft.com/en-us/aspnet/core/mvc/views/layout). I may be exaggerating its merits and it's all a matter of habit, but I decided to try to create something similar for Node.js & Express library. I must say that I was able to find the closest to Razor supported library, but some points were quite different from Razor which I was used to and they just looked much less concise and convenient to me (like layouts and partial blocks, for example). So, proceed to the description of my creation... my first JavaScript creation actually.




----------------------
DRAFT:
----------------------
* `Html.layout` is optional.
* `Html.body` is optional.
* `Html.section` can be called from the `Layout`and any other `View`.
* `@section {...}` can be declared in any `View` including partial views.

* Run tests: npm run wtest
*     "start": "node ./test/server.live.js",
