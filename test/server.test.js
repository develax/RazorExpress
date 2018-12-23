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

const errorHeader = "A template compilation error occured";

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
                    let sharedTests = $('div.shared-data:contains("Test shared object.")');
                    expect(sharedTests, "views shared data test").to.have.lengthOf(3);
                    // Check rendering partials from section with different path styles (they should be siblings).
                    let sectionTest = $('#section-test');
                    expect(sectionTest, '#section-test').to.have.lengthOf(1);
                    let partial1 = sectionTest.next();
                    expect(partial1.attr('id'), '#partial_1').to.be.equal('partial_1');
                    let partial2 = partial1.next();
                    expect(partial2.attr('id'), '#partial_2').to.be.equal('partial_2');

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
                    expect(h1.text()).to.have.string(errorHeader);
                    let layouts = $(`:contains(invalid.raz" cannot find the layout view)`);
                    expect(layouts, "error message").to.have.lengthOf.above(0);
                    console.log(`> testing rote "/invalid"...done`);
                    done();
                });
        });
    });

    {
        let route = "/errors/laytouterror";
        describe(route, () => {
            console.log(`> testing rote ${route}...`);
            it("check failure of rendering layout", (done) => {
                chai.request(server)
                    .get(route)
                    .end((err, res) => {
                        expect(res).to.have.status(500);
                        let $ = jQuery(res.text);
                        let h1 = $('h1');
                        expect(h1.length).to.be.equal(1);
                        expect(h1.text()).to.have.string(errorHeader);
                        let errorMainLines = $('.error');
                        expect(errorMainLines, '2 error lines are expected').to.have.lengthOf(2);
                        let layouts = $(`#error:contains(temp is not defined)`);
                        expect(layouts, '"temp is not defined" text is expected').to.have.lengthOf(1);
                        let errorViews = $('.code');
                        expect(errorViews, '2 error views are expected').to.have.lengthOf(2);
                        let viewSourceHeader = errorViews.find(`:contains(laytouterror.raz)`);
                        expect(viewSourceHeader, '"laytouterror.raz" header is expected').to.have.lengthOf(1);
                        let layoutSourceHeader = errorViews.find(`:contains(_layout.raz)`);
                        expect(layoutSourceHeader, '"_layout.raz" header is expected').to.have.lengthOf(1);
                        console.log(`> testing rote  ${route} is done`);
                        done();
                    });
            });
        });
    }

    {
        let route = "/errors/partialerror";
        describe(route, () => {
            console.log(`> testing rote ${route}...`);
            it("check failure of rendering layout", (done) => {
                chai.request(server)
                    .get(route)
                    .end((err, res) => {
                        expect(res).to.have.status(500);
                        let $ = jQuery(res.text);
                        let h1 = $('h1');
                        expect(h1.length).to.be.equal(1);
                        expect(h1.text()).to.have.string(errorHeader);
                        let errorMainLines = $('.error');
                        expect(errorMainLines, '2 error lines are expected').to.have.lengthOf(2);
                        let layouts = $(`#error:contains(temp is not defined)`);
                        expect(layouts, '"temp is not defined" text is expected').to.have.lengthOf(1);
                        let errorViews = $('.code');
                        expect(errorViews, '3 error views are expected').to.have.lengthOf(3);
                        let viewSourceHeader = errorViews.find(`:contains(partialerror.raz)`);
                        expect(viewSourceHeader, '"partialerror.raz" header is expected').to.have.lengthOf(1);
                        let layoutSourceHeader = errorViews.find(`:contains(_layout.raz)`);
                        expect(layoutSourceHeader, '"_layout.raz" header is expected').to.have.lengthOf(1);
                        let partialSourceHeader = errorViews.find(`:contains(_partial.raz)`);
                        expect(partialSourceHeader, '"_partial.raz" header is expected').to.have.lengthOf(1);
                        console.log(`> testing rote  ${route} is done`);
                        done();
                    });
            });
        });
    }

});