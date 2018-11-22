//'use strict';

module.exports = function (args) {
    args = args || {};
    const ParserError = require('../core/errors/ParserError');
    const path = require('path');
    const app = require('express')();
    
    const razor = require("../index");
    razor.register(app);

    var viewsPath = path.join(__dirname, args.views || '/views');
    app.set('views', viewsPath);
    // ^ In real app you can just write this: +
    // app.set('view engine', "raz"); 
    // instead of those 3 lines above.



    // Parser call..
    var html = razor.compileSync({ 
        template: '<span>@(Model)</span>', 
        model: "Hello World!"
    });
    console.log(html);


    // var cwd = process.cwd();
    // var tmp = require('os').tmpdir();
    // console.log(cwd);
    // console.log(tmp);

    // app.use(function (req, res, next) {
    //     res.locals.req = req;
    //     next();
    // });

    app.get('/', (rq, rs) => {
        rs.render("./home/index", { message: "This is my first NodeJS Express View engine!" });
    });

    app.get('/invalid', (rq, rs) => {
        rs.render("./home/invalid", { message: "This is my first NodeJS Express View engine!" });
    });

    app.get('/hidden', (rq, rs) => {
        rs.render("./home/hidden", { message: "This is my first NodeJS Express View engine!" });
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

    app.use(appErrorHandler);

    function appErrorHandler(err, req, res, next) {
        if (res.headersSent)
            return next(err); // must

        var env = app.get('env');

        if (env !== "production" && err instanceof ParserError) {
            var errorHtml = err.getHtml();
            res.status(500);
            res.send(errorHtml);
        }
        else {
            return next(err);
        }


        //res.status(500);
        //res.render('error', { error: err });
    }

    const port = process.env.PORT || 1337;

    return {
        app,
        startServer() {
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

}

