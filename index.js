'use strict';

//
// Plugin name.
//
exports.name = 'xhr';

/**
 * The server-side plugin for BigPipe which adds a proxy function.
 *
 * @param {BigPipe} pipe The BigPipe instance.
 * @param {Object} options Optional options.
 * @api public
 */
exports.server = function server(pipe, options) {
  pipe.on('transform:pagelet:after', function optimized(Pagelet, next) {
    /**
     * Helper that will send a JSON response with a render `false` flag.
     * This ensures the client does not re-render the target pagelet.
     * Only define this helper if the Pagelet does not have a defined
     * readable, this could potentially destory a Pagelet that does not require
     * this plugin to work.
     *
     * @param {Object} data JSON data that needs to be written to the response
     * @return {Pagelet} fluent interface
     */
    if (!Pagelet.prototype.plain) Pagelet.readable('plain', function plain(data) {
      this._res.setHeader('plain', true);
      this.end(data);

      return this;
    });

    next(null, Pagelet);
  });
};

/**
 * The client-side plugin for BigPipe which adds XHR functionality.
 *
 * @param {BigPipe} pipe The BigPipe instance.
 * @param {Object} options Optional options.
 * @api public
 */
exports.client = function client(pipe, options) {
  pipe.on('create', function created(pagelet) {
    var xhr = require('xhr')
      , async = pagelet.xhr = {};

    /**
     * Proxy XHR GET request.
     *
     * @param {String} uri Target url.
     * @param {Function} done Completion callback.
     * @api public
     */
    async.get = function get(uri, done) {
      xhr({ method: 'get', uri: uri }, process(done));
    };

    /**
     * Proxy XHR POST request.
     *
     * @param {String} uri Target url.
     * @param {Object} data Optional data.
     * @param {Function} done Completion callback.
     * @api public
     */
    async.post = function post(uri, data, done) {
      if ('function' !== typeof done) {
        done = data;
        data = {};
      }

      var object = {
        method: 'post',
        uri: uri
      };

      object['string' === typeof data ? 'body' : 'json'] = data;
      xhr(object, process(done));
    };

    /**
     * Proxy XHR PUT request.
     *
     * @param {String} uri Target url.
     * @param {Object} data Optional data.
     * @param {Function} done Completion callback.
     * @api public
     */
    async.put  = function put(uri, data, done) {
      if ('function' !== typeof done) {
        done = data;
        data = {};
      }

      var object = {
        method: 'put',
        uri: uri
      };

      object['string' === typeof data ? 'body' : 'json'] = data;
      xhr(object, process(done));
    };

    /**
     * Proxy XHR DELETE request.
     *
     * @param {String} uri Target url.
     * @param {Function} done Completion callback.
     * @api public
     */
    async.delete = function get(uri, done) {
      xhr({ method: 'delete', uri: uri }, process(done));
    };

    /**
     * Return function that processes the response to XHR.
     *
     * @param {Function} done Completion callback.
     * @return {Function} processor
     * @api private.
     */
    function process(done) {
      /**
       * Process the XHR response. If the header `plain` is set to `true`,
       * return the data directly to the callback.
       *
       * @param {Error} error
       * @param {XMLHttpRequest} response
       * @param {Mixed} body HTML or JSON
       * @api private
       */
      return function complete(error, response, body) {
        var headers = response.headers || {}
          , status = response.statusCode || 500;

        if (error || status >= 400) {
          return done(error || new Error('Status: '+ status));
        }

        //
        // Plain response header set, do not re-render the pagelet.
        //
        if (headers.plain === 'true') {
          return done(null, response, body);
        }

        //
        // Process the returned data and render the Pagelet.
        //
        pipe.once(pagelet.name +':render', function rendered(html) {
          done(null, response, body);
        });

        pagelet.render(body);
      };
    }
  });
};