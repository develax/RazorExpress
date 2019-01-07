const url = require('url');

module.exports = class RazorContext {
    
    constructor(request){
        this.req = request;
        this.siteUrl = this.fullUrl();
        this.requestUrl = this.fullUrl(this.req.originalUrl);
    }

    fullUrl(path)
    {
        path = path || '';
        let result = url.format({
            protocol: this.req.protocol,
            host: this.req.get('host'),
            pathname: path
          });
        return result
    }
}