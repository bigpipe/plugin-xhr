'use strict';

var assume = require('assume')
  , EventEmitter = require('events').EventEmitter
  , Pagelet = require('pagelet')
  , xhr = require('./')
  , Local, pipe;

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

  describe('server side plugin', function () {
    beforeEach(function () {
      pipe = new EventEmitter;
      Local = Pagelet.extend();
    });

    afterEach(function () {
      pipe = null;
    });

    it('waits for transform:pagelet:after event', function (done) {
      xhr.server(pipe);

      assume(pipe._events).to.have.property('transform:pagelet:after');
      pipe.emit('transform:pagelet:after', Local, done);
    });

    it('adds proxy method plain to the Pagelet prototype', function (done) {
      xhr.server(pipe);

      assume(Local.prototype).to.not.have.property('plain');
      pipe.emit('transform:pagelet:after', Local, function (error, Transformed) {
        assume(error).to.equal(null);
        assume(Transformed.prototype.plain).to.be.a('function');

        done();
      });
    });

    it('will not override earlier defined plain property');
    it('#plain wil set header plain to true');
    it('#plain will call end with data');
  });
});