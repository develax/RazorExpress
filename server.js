//'use strict';

const app = require('express')();

require("./core/jshtml").initEngine(app);

const ParserError = require('./core/localization/ParserError');


app.get('/', (rq, rs) => {
    rs.render("./home/index", { message: "This is my first NodeJS Express View engine!" });
});

app.get('/invalid', (rq, rs) => {
    rs.render("./home/invalid", { message: "This is my first NodeJS Express View engine!" });
});

app.get('/hidden', (rq, rs) => {
    rs.render("./home/hidden", { message: "This is my first NodeJS Express View engine!" });
});

app.get('/sections', (rq, rs) => {
    rs.render("./sections/index", { title: "This is a TITLE", content: 'This is CONTENT.', footer: "This is FOOTER" });
});

process.on('unhandledRejection', error => {
    console.error('unhandledRejection:', error.message, error.stack);
});

module.exports = app;

app.use(appErrorHandler);

function appErrorHandler(err, req, res, next) {
    if (res.headersSent)
        return next(err); // must

    var env = app.get('env');

    if (env !== "production" && err instanceof ParserError) {
        var errorHtml = err.getFormatted();
        res.status(500);
        res.send(errorHtml);
    }
    //return next(err);
    
    //res.status(500);
    //res.render('error', { error: err });
}

const port = process.env.PORT || 1337;

(function startServer() {
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
})();