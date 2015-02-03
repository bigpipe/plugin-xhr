'use strict';

var assume = require('assume')
  , xhr = require('./');

describe('BigPipe Plugin XHR', function () {
  describe('is module', function () {
    it('which exports name xhr', function () {
      assume(xhr.name).to.be.a('string');
      assume(xhr.name).to.equal('xhr');
    });

    it('which exports server side plugin', function () {
      assume(xhr.server).to.be.a('function');
      assume(xhr.server.length).to.equal(2);
    });

    it('which exports client side plugin', function () {
      assume(xhr.client).to.be.a('function');
      assume(xhr.client.length).to.equal(2);
    });
  });
});