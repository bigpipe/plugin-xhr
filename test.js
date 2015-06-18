'use strict';

var assume = require('assume')
  , EventEmitter = require('events').EventEmitter
  , Pagelet = require('pagelet')
  , xhr = require('./')
  , Local, bigpipe;

function noop() {}

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
      bigpipe = new EventEmitter;
      Local = Pagelet.extend();
    });

    afterEach(function () {
      bigpipe = Local = null;
    });

    it('waits for transform:pagelet:after event', function (done) {
      xhr.server(bigpipe);

      assume(bigpipe._events).to.have.property('transform:pagelet:after');
      bigpipe.emit('transform:pagelet:after', Local, done);
    });

    it('adds proxy method plain to the Pagelet prototype', function (done) {
      xhr.server(bigpipe);

      assume(Local.prototype).to.not.have.property('plain');
      bigpipe.emit('transform:pagelet:after', Local, function (error, Transformed) {
        assume(error).to.equal(null);
        assume(Transformed.prototype.plain).to.be.a('function');

        done();
      });
    });

    it('will not override earlier defined plain property', function (done) {
      xhr.server(bigpipe);

      var Has = Local.extend({ plain: 'test' })
      bigpipe.emit('transform:pagelet:after', Has, function (error, Transformed) {
        assume(error).to.equal(null);
        assume(Transformed.prototype.plain).to.equal('test');

        done();
      });
    });

    it('#plain wil set header plain to true', function (done) {
      xhr.server(bigpipe);

      bigpipe.emit('transform:pagelet:after', Local, function (error, Transformed) {
        var header;

        assume(error).to.equal(null);
        assume(Transformed.prototype.plain).to.be.a('function');

        header = new Transformed;
        header.bootstrap = { name: 'bootstrap', flush: noop };
        header._res = {
          setHeader: function setHeader(header, value) {
            assume(header).to.equal('plain');
            assume(value).to.equal(true);
            done();
          }
        };

        header.plain();
      });
    });

    it('#plain will call end with data', function (done) {
      xhr.server(bigpipe);

      bigpipe.emit('transform:pagelet:after', Local, function (error, Transformed) {
        var end;

        end = new Transformed;
        end._res = { setHeader: noop };
        end.bootstrap = {
          flush: noop,
          name: 'bootstrap',
          queue: function (name, parent, data) {
            assume(data).to.equal('test');
            done();
          }
        };

        assume(error).to.equal(null);
        assume(Transformed.prototype.plain).to.be.a('function');

        end.plain('test');
      });
    });
  });

  //
  // Testing is done without a proper client, but this works out
  // as none of the code actually requires a browser environment.
  //
  describe('client side plugin', function () {
    var local, stub;

    //
    // Needed to stub the code loaded into node.
    //
    require('xhr');
    module.children.forEach(function each(child) {
      if (~child.id.indexOf('/node_modules/xhr/')) stub = child;
    });

    Pagelet = Pagelet.extend({
      render: function (body) { this._bigpipe.emit(this.name +':render') }
    });

    beforeEach(function () {
      bigpipe = new EventEmitter;
      local = new Pagelet({ bigpipe: bigpipe });
    });

    afterEach(function () {
      bigpipe = local = null;
    });

    it('waits for create event', function () {
      xhr.client(bigpipe);
      bigpipe.emit('create', local);

      assume(bigpipe._events).to.have.property('create');
      assume(local.xhr).to.have.property('get');
      assume(local.xhr).to.have.property('post');
      assume(local.xhr).to.have.property('delete');
      assume(local.xhr).to.have.property('put');
    });

    describe('#get', function () {
      it('is a function', function () {
        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        assume(local.xhr.get).to.be.a('function');
        assume(local.xhr.get.length).to.equal(2);
      });

      it('is called with predefined properties', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'get');
          assume(options).to.have.property('uri', '/test');
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.get('/test', function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });

      it('returns error on undefined or status codes >= 400', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'get');
          assume(options).to.have.property('uri', '/test');
          assume(next).to.be.a('function');
          next(null, {}, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.get('/test', function test(error, response, body) {
          assume(error).to.be.instanceof(Error);
          assume(error.message).to.equal('Status: 500');
          assume(response).to.equal(undefined);
          assume(body).to.equal(undefined);
          done();
        });
      });

      it('returns early if headers.plain equals true', function (done) {
        var Test = Pagelet.extend({ load: noop })
          , test = new Test({ bigpipe: bigpipe });

        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'get');
          assume(options).to.have.property('uri', '/test');
          assume(next).to.be.a('function');
          next(null, { statusCode: 200, headers: { plain: 'true' }}, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', test);

        test.xhr.get('/test', function test(error, response, body) {
          assume(error).to.equal(null)  ;
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });
    });

    describe('#delete', function () {
      it('is a function', function () {
        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        assume(local.xhr.delete).to.be.a('function');
        assume(local.xhr.delete.length).to.equal(2);
      });

      it('is called with predefined properties', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'delete');
          assume(options).to.have.property('uri', '/test');
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.delete('/test', function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });
    });

    describe('#post', function () {
      it('is a function', function () {
        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        assume(local.xhr.post).to.be.a('function');
        assume(local.xhr.post.length).to.equal(3);
      });

      it('is called with predefined properties', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'post');
          assume(options).to.have.property('uri', '/test');
          assume(options).to.have.property('json');
          assume(options.json).to.have.property('data', 'query');
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.post('/test', { data: 'query' }, function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });

      it('data object can be omitted', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'post');
          assume(options).to.have.property('uri', '/test');
          assume(options).to.have.property('json');
          assume(Object.keys(options.json).length).to.equal(0);
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.post('/test', function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });

      it('data object can be a string', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'post');
          assume(options).to.have.property('uri', '/test');
          assume(options.body).to.equal('search');
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.post('/test', 'search', function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });
    });

    describe('#put', function () {
      it('is a function', function () {
        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        assume(local.xhr.put).to.be.a('function');
        assume(local.xhr.put.length).to.equal(3);
      });

      it('is called with predefined properties', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'put');
          assume(options).to.have.property('uri', '/test');
          assume(options).to.have.property('json');
          assume(options.json).to.have.property('data', 'query');
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.put('/test', { data: 'query' }, function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });

      it('data object can be omitted', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'put');
          assume(options).to.have.property('uri', '/test');
          assume(options).to.have.property('json');
          assume(Object.keys(options.json).length).to.equal(0);
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.put('/test', function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });

      it('data object can be a string', function (done) {
        stub.exports = function (options, next) {
          assume(options).to.be.an('object');
          assume(options).to.have.property('method', 'put');
          assume(options).to.have.property('uri', '/test');
          assume(options.body).to.equal('search');
          assume(next).to.be.a('function');
          next(null, { statusCode: 200 }, 'test');
        };

        xhr.client(bigpipe);
        bigpipe.emit('create', local);

        local.xhr.put('/test', 'search', function test(error, response, body) {
          assume(error).to.equal(null);
          assume(response).to.be.an('object');
          assume(body).to.equal('test');
          done();
        });
      });
    });
  });
});