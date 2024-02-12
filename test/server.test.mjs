console.log("STARTED: server.test.js");

import chai from 'chai';
import chaiHttp from 'chai-http';
const expect = chai.expect;
chai.use(chaiHttp);
import * as jsdom from "jsdom"
const { JSDOM } = jsdom;
import * as jquery_ from "jquery"
const jquery = jquery_.default;
const port = 8000;
import * as P from "./server.live.mjs"

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
    const server = P.default().app;
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
        this.timeout(5000)
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
        console.log(`> testing route "/"...`);
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
                    assertModelMessage($, "This is my first NodeJS Express View engine!");
                    // Check rendering partials from section with different path styles (they should be siblings).
                    let sectionTest = $('#section-test');
                    expect(sectionTest, '#section-test').to.have.lengthOf(1);
                    let partial1 = sectionTest.next();
                    expect(partial1.attr('id'), '#partial_1').to.be.equal('partial_1');
                    let partial2 = partial1.next();
                    expect(partial2.attr('id'), '#partial_2').to.be.equal('partial_2');
                    let url = $('#scope');
                    expect(url, "site URL container must exist").to.have.lengthOf(1);
                    expect(url.text()).to.startsWith("MY-SCOPE");

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
                    assertModelMessage($, "This is a hidden page.");
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
                    console.log(res.text);
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
                        //expect(errorMainLines, '2 error lines are expected').to.have.lengthOf(1);
                        let layouts = $(`#error:contains(temp is not defined)`);
                        //expect(layouts, '"temp is not defined" text is expected').to.have.lengthOf(1);
                        let errorViews = $('.code');
                        expect(errorViews, '2 error views are expected').to.have.lengthOf(2);
                        let viewHeader = $(errorViews[0]).find(`.filepath:contains(laytouterror.raz)`);
                        expect(viewHeader, '"laytouterror.raz" header is expected').to.have.lengthOf(1);
                        let layoutHeader = $(errorViews[1]).find(`.filepath:contains(_layout.raz)`);
                        expect(layoutHeader, '"_layout.raz" header is expected').to.have.lengthOf(1);
                        let errorText = $(errorViews[1]).find('.multilight').text();
                        expect(errorText).equal("@temp");
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
            it("check failure of rendering partial view", (done) => {
                chai.request(server)
                    .get(route)
                    .end((err, res) => {
                        expect(res).to.have.status(500);
                        let $ = jQuery(res.text);
                        assertErrorHeader($);
                        assertErrorText($, "'</div>' tag at line 6 pos 1 is missing matching start tag");
                        assertSourceViews($, ["partialerror.raz", "_layout.raz", "_partial.raz"], "</div>");
                        console.log(`> testing rote  ${route} is done`);
                        done();
                    });
            });
        });
    }

    {
        let route = "/errors/jsSyntaxError";
        describe(route, () => {
            console.log(`> testing rote ${route}...`);
            it("syntax error must be found in the template source text and highlighted", (done) => {
                chai.request(server)
                    .get(route)
                    .end((err, res) => {
                        expect(res).to.have.status(500);
                        let $ = jQuery(res.text);
                        assertErrorHeader($);
                        assertErrorText($, "Unexpected identifier");
                        assertSourceViews($, ["jsSyntaxError.raz"], "@for(int i = 0; i < 5; i++) {");
                        console.log(`> testing rote  ${route} is done`);
                        done();
                    });
            });
        });
    }

    {
        let route = "/errors/jsSyntaxErrorNotDetected";
        describe(route, () => {
            console.log(`> testing rote ${route}...`);
            it("syntax error must NOT be highlighted in the template source text if it contains more than 1 occurrences of the error string ", (done) => {
                chai.request(server)
                    .get(route)
                    .end((err, res) => {
                        expect(res).to.have.status(500);
                        let $ = jQuery(res.text);
                        assertErrorHeader($);
                        assertErrorText($, "Unexpected identifier");
                        assertSourceViews($, ["jsSyntaxErrorNotDetected.raz"]);
                        console.log(`> testing rote  ${route} is done`);
                        done();
                    });
            });
        });
    }

    {
        let route = "/models/index";
        describe(route, () => {
            console.log(`> testing rote ${route}...`);
            it("partial view's `null` or `empty-string` value model should not be replaced with the main model and must be displayed as an empty string", (done) => {
                chai.request(server)
                    .get(route)
                    .end((err, res) => {
                        expect(res).to.have.status(200);
                        let $ = jQuery(res.text);
                        let partialViewNullModel = $(".partial-view-null-model-container");
                        expect(partialViewNullModel, "containers coun = 4").to.have.length(4);
                        expect(partialViewNullModel[0].textContent.trim(), "'' is rendered as ''").to.equal("");
                        expect(partialViewNullModel[1].textContent.trim(), "`null` is rendered as ''").to.equal("");
                        expect(partialViewNullModel[2].textContent.trim(), "`0` is rendered as '0'").to.equal("0");
                        expect(partialViewNullModel[3].textContent.trim(), "`undefined` is substituted with the parent view object").to.equal("[object Object]");
                        done();
                    });
            });
        });
    }

    {
        let route = "/browser";
        describe(route, () => {
            console.log(`> testing rote ${route}...`);
            it("razor-js", (done) => {
                let options = {
                    resources: "usable",
                    runScripts: "dangerously"
                };
                JSDOM.fromURL("http://localhost:" + port + route, options)
                    .then(dom => {
                        setTimeout(() => {
                            let $ = jquery(dom.window);
                            let h1 = $('h1');
                            expect(h1.length).to.be.equal(1);
                            expect(h1.text()).to.have.string("RAZ browser dynamic test");
                            assertModelMessage($, "This is a browser page.");
                            console.log(`> testing rote  ${route} is done`);
                            done();
                        }, 1000);
                    },
                        err => {
                            done(err.message.substr(0, 200))
                        });
            });
        });
    }

    {
        let route = "/browser-error";
        describe(route, () => {
            console.log(`> testing rote ${route}...`);
            it("razor-js-error", (done) => {
                let options = {
                    resources: "usable",
                    runScripts: "dangerously"
                };
                JSDOM.fromURL("http://localhost:" + port + route, options)
                    .then(dom => {
                        setTimeout(() => {
                            let $ = jquery(dom.window);
                            assertErrorHeader($);
                            assertErrorText($, "Error: '</span>' tag at line 5 pos 24 is missing matching start tag.");
                            assertSourceViews($, ["Template:"]);
                            console.log(`> testing rote  ${route} is done`);
                            done();
                        }, 1000);
                    },
                        err => {
                            done(err.message.substr(0, 200));
                        });
            });
        });
    }
});


function assertErrorHeader($) {
    let h1 = $('h1');
    expect(h1.length, "header must exist").to.be.equal(1);
    expect(h1.text()).to.have.string(errorHeader);
}

function assertErrorText($, text) {
    let errorMainLines = $('.error');
    expect(errorMainLines, '1 error line is expected').to.have.lengthOf.at.least(1);
    expect(errorMainLines[0].textContent, "error message").to.have.string(text);
}

function assertSourceViews($, viewNames, lastViewNameErrorToken) {
    let num = viewNames.length;
    let errorViews = $('.code');
    expect(errorViews, `${num} error views are expected`).to.have.lengthOf(num);

    if (!viewNames) return;

    for (var i = 0; i < viewNames.length; i++) {
        let viewName = viewNames[i];
        let viewSourceHeader = $(errorViews[i]).find(`.filepath:contains(${viewName})`);
        expect(viewSourceHeader, `"${viewName}" header is expected`).to.have.lengthOf(1);
    }

    if (!lastViewNameErrorToken) return;

    let errorText = $(errorViews[errorViews.length - 1]).find('.source-error').text();
    expect(lastViewNameErrorToken, "highlighted error text in the template source code").include(errorText);
}
function assertModelMessage($, expectedText) {
    var modelMessage = $(".model-message").text();
    expect(modelMessage, "model message").to.have.string(expectedText);
}