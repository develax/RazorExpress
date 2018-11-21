module.exports = class HtmlString {
    constructor(html) {
        this.html = html;
    }

    toString() {
        return this.html;
    }
}