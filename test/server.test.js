console.log("STARTED: server.test.js");

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const jquery = require('jquery');
// const path = require('path');
// const fs = require('fs');

// blog-post: https://groundberry.github.io/development/2016/12/10/testing-express-with-mocha-and-chai.html
// https://davidbeath.com/posts/testing-http-responses-in-nodejs.html
// json testing: https://scotch.io/tutorials/test-a-node-restful-api-with-mocha-and-chai
// simon: https://nicolas.perriault.net/code/2013/testing-frontend-javascript-code-using-mocha-chai-and-sinon/

function isJQuery(obj) {
    return obj.get && Object.prototype.toString.call(obj.get) === "[object Function]";
}

function jQuery(html) {
    return jquery(new JSDOM(html).window);
}

function find(html, selector, text) {
    //if (isJQuery(html))
    //    return html.find(selector).filter(function () { return $(this).text() === text; });

    $ = jquery(new JSDOM(html).window);
    return $(selector).filter(function () { return $(this).text() === text; });
}


describe("server routes", () => {
    console.log(`Testing live Server...`);
    const server = require('./server.live')().app;
    const port = 8000;
    var socket;

    function startServer(done) {
        console.log(`Server is starting up on port ${port}...`);

        socket = server.listen(port, () => {
            console.log(`Server's started up on port ${port}.`);
            done();
        });

        socket.on('error', function (e) {
            var errorMessage;
            if (e.code === 'EADDRINUSE')
                errorMessage = `Error starting server on port ${port}, it's already in use.`;
            else
                errorMessage = `Error starting server on port ${port}, code = ${e.code}.`;

            if (errorMessage)
                console.log(errorMessage);

            done(errorMessage);
        });
    }

    before(function (done) {
        startServer(errorMessage => {
            done(errorMessage);
        });
    });

    after(function (done) {
        console.log(`Server is closing port ${port}.`);
        socket.close((err) => {
            var message;
            if (err)
                message = `Error closing server port ${port}: ${err}`;
            else
                message = `Server port ${port} is closed.`

            console.log(message);
            done(err ? message : '');
        });
    });

    describe("/", () => {
        console.log(`> testing rote "/"...`);
        it("check html-layouts hierarchy", (done) => {
            chai.request(server)
                .get('/')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let layoutNames = ['_layout', '_layoutYellow', '_layoutRed', '_layoutBlue'];
                    let $ = jQuery(res.text);
                    let layouts = $(`div > strong:contains('${layoutNames[0]}')`);
                    expect(layouts, "layouts count").to.have.lengthOf(layoutNames.length);

                    for (var i = 0; i < layouts.length; i++) {
                        let layout = layouts[i];
                        let name = layoutNames[i];
                        expect(layout.textContent, name).to.be.equal(name);
                    }

                    console.log(`> testing rote "/"...done`);
                    done();
                });
        });
    });

    describe("/hidden", () => {
        console.log(`> testing rote "/hidden"...`);
        it("check layout explicit path", (done) => {
            chai.request(server)
                .get('/hidden')
                .end((err, res) => {
                    expect(res).to.have.status(200);
                    let layoutNames = ['_layout', '_layoutHidden', '_layoutOrange'];
                    let $ = jQuery(res.text);
                    let layouts = $(`div > strong:contains('${layoutNames[0]}')`);
                    expect(layouts, "layouts count").to.have.lengthOf(layoutNames.length);

                    for (var i = 0; i < layouts.length; i++) {
                        let layout = layouts[i];
                        let name = layoutNames[i];
                        expect(layout.textContent, name).to.be.equal(name);
                    }

                    console.log(`> testing rote "/hidden"...done`);
                    done();
                });
        });
    });

    describe("/invalid", () => {
        console.log(`> testing rote "/invalid"...`);
        it("check failure of finding layout", (done) => {
            chai.request(server)
                .get('/invalid')
                .end((err, res) => {
                    expect(res).to.have.status(500);
                    let $ = jQuery(res.text);
                    let h1 = $('h1');
                    expect(h1.length).to.be.equal(1);
                    expect(h1.text()).to.have.string("A template compilation error occured");
                    let layouts = $(`:contains(RazorError: The view "invalid.raz" cannot find the partial view)`);
                    expect(layouts, "error message").to.have.lengthOf.above(0);
                    console.log(`> testing rote "/invalid"...done`);
                    done();
                });
        });
    });
});