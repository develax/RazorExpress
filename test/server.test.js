(function () {
    console.log("STARTED: server.test.js");

    const chai = require('chai');
    const chaiHttp = require('chai-http');
    const server = require('../server');
    const expect = chai.expect;
    chai.use(chaiHttp);
    const jsdom = require("jsdom");
    const { JSDOM } = jsdom;
    const jquery = require('jquery');

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
        before(function (done) {
            server.listen(8000, done);
        });

        describe("/", () => {
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

                        done();
                    });
            });
        });

        describe("/hidden", () => {
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

                        done();
                    });
            });
        });

        describe("/invalid", () => {
            it("check failure of finding layout", (done) => {
                chai.request(server)
                    .get('/invalid')
                    .end((err, res) => {
                        expect(res).to.have.status(500);
                        let $ = jQuery(res.text);
                        let layouts = $(`:contains("/home/_layoutOrange" couldn't be found)`);
                        expect(layouts, "error message").to.have.lengthOf.above(0);
                        done();
                    });
            });
        });


        //after(function () {
        //    server.close();
        //});
    });

})();

