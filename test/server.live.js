//'use strict';

class MyScope {
    constructor() {
        this.scopeTestFunc = function (val) {
            return val;
        }
        this.scopeValue = "MY-SCOPE";
    }
}

module.exports = function (args) {
    args = args || {};
    const path = require('path');
    const express = require('express');
    const app = express();

    const razor = require("../index");
    razor.register(app);

    var viewsPath = path.join(__dirname, args.views || '/views');
    app.set('views', viewsPath);
    // ^ In real app you can just write this: +
    // app.set('view engine', "raz"); 
    // instead of those 3 lines above.

    // app.use(function (req, res, next) {
    //     res.locals.req = req;
    //     next();
    // });

    // const raz = require("../index-browser");
    // var result = raz.compile("<div>@Model</div>", 5);

    var logger = function (req, res, next) {
        console.log("request url: " + req.url);
        next(); // Passing the request to the next handler in the stack.
    }

    function scope(req, res, next) {
        res.locals.$ = new MyScope();
        next();
    }

    app.use(logger);
    var jsStatic = express.static(".");
    app.use("/js", jsStatic).use(scope);

    app.get("/favicon.ico", (req, res)=>{
        res.status("404").send("Not found.");
    })

    app.get('/', (rq, rs) => {
        rs.render("./home/index", { message: "This is my first NodeJS Express View engine!" });
    });

    app.get('/invalid', (rq, rs) => {
        rs.render("./home/invalid", { message: "This is an error page." });
    });

    app.get('/hidden', (rq, rs) => {
        rs.render("./home/hidden", { message: "This is a hidden page." });
    });

    app.get('/browser', (rq, rs) => {
        rs.render("./home/browser", { message: "This is a browser page." });
    });

    app.get('/browser-error', (rq, rs) => {
        rs.render("./home/browser-error", { message: "This is my first NodeJS Express View engine!" });
    });

    app.get('*', (rq, rs) => {
        let routePath = "." + rq.path;
        rs.render(routePath, {});
    });

    // app.get('/', (rq, rs) => {
    //     rs.render("./sections/index", { header: "This is a HEADER", content: 'This is CONTENT.', footer: "This is FOOTER" });
    // });

    // app.get('/sections/errors/requiredSectionNotFound', (rq, rs) => {
    //     rs.render("./sections/errors/requiredSectionNotFound", { });
    // });

    // app.get('/sections/errors/sectionBeenRendered', (rq, rs) => {
    //     rs.render("./sections/errors/sectionBeenRendered", {});
    // });

    // process.on('unhandledRejection', error => {
    //     console.error('unhandledRejection:', error.message, error.stack);
    // });

    //app.get('/', (rq, rs) => {
    //    rs.render("./test/index", { message: "This is my first NodeJS Express View engine!" });
    //});

    razor.handleErrors(app, 500);
    const port = process.env.PORT || 1337;

    return {
        app,
        startServer
    }

    function startServer() {
        var server = app.listen(port, (e, b, c) => {
            console.log("Server is up on port " + port);
        });
        server.on('error', function (e) {
            if (e.code === 'EADDRINUSE') {
                console.log('Address in use, retrying...');
                setTimeout(() => {
                    server.close();
                    startServer();
                }, 3000);
            }
        });
    }
}

