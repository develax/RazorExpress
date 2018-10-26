//'use strict';

const app = require('express')();

require("./core/jshtml").initEngine(app);




app.get('/', (rq, rs) => {
    rs.render("./home/index", { message: "This is my first NodeJS Express View engine!" });
});

app.get('/invalid', (rq, rs) => {
    rs.render("./home/invalid", { message: "This is my first NodeJS Express View engine!" });
});

app.get('/hidden', (rq, rs) => {
    rs.render("./home/hidden", { message: "This is my first NodeJS Express View engine!" });
});

process.on('unhandledRejection', error => {
    console.error('unhandledRejection:', error.message, error.stack);
});

module.exports = app;

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