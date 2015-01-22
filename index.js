'use strict';

//
// Plugin name.
//
exports.name = 'async';

/**
 * The client-side plugin for BigPipe which adds XHR functionality.
 *
 * @param {BigPipe} pipe The BigPipe instance.
 * @param {Object} options .
 * @api public
 */
exports.client = function client(pipe, options) {
  var xhr = require('xhr')
    , async = pipe.xhr = {};

  /**
   * GET request via xhr.
   *
   * @param {String} uri Target url.
   * @param {Function} done Completion callback.
   * @api public
   */
  async.get = function get(uri, done) {
    xhr({ method: 'get', uri: uri }, done);
  };

  /**
   * POST request via xhr.
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
    xhr(object, done);
  };
};