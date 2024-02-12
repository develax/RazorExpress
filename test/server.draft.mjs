import * as path from "path"
import * as express from "express"
import * as razor from "../index.mjs"
const app = express();

razor.register(app);

var viewsPath = path.join(__dirname, '/views.draft');
app.set('views', viewsPath);

app.get('/', (req, res) => {
    const model = {
        title: "Names of the Days of the Week",
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    res.render("./index", model);
});

const port = process.env.PORT || 1337;

const server = app.listen(port, (e, b, c) => {
    console.log("Server is up on port " + port);
});

server.on('error', function (e) {
    if (e.code === 'EADDRINUSE') {
        console.log('Address in use, retrying...');
        server.close();
    }
});