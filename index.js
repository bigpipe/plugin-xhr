'use strict';

var xhr = require('xhr');

/**
 * The client-side plugin for BigPipe which adds XHR functionality.
 *
 * @param {BigPipe} pipe The BigPipe instance.
 * @param {Object} options .
 * @api public
 */
exports.client = function client(pipe, options) {
  var async = pipe.xhr = {};

  async.post = function post(uri, data, done) {
    xhr({
      method: 'post',
      body: data,
      uri: uri
    }, done)
  };

  async.get = function get(uri, data, done) {
    xhr({
      method: 'get',
      body: 'string' === typeof data ? data : JSON.stringify(data),
      uri: uri
    }, done)
  };
};