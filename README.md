# BigPipe - Plugin XHR

[![Version npm][version]](http://browsenpm.org/package/bigpipe-xhr)[![Build Status][build]](https://travis-ci.org/bigpipe/plugin-xhr)[![Dependencies][david]](https://david-dm.org/bigpipe/plugin-xhr)[![Coverage Status][cover]](https://coveralls.io/r/bigpipe/plugin-xhr?branch=master)

[version]: http://img.shields.io/npm/v/bigpipe-xhr.svg?style=flat-square
[build]: http://img.shields.io/travis/bigpipe/plugin-xhr/master.svg?style=flat-square
[david]: https://img.shields.io/david/bigpipe/plugin-xhr.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/bigpipe/plugin-xhr/master.svg?style=flat-square

[Bigpipe] plugin that will add XHR proxy methods to each pagelet. Allows for
asynchronous rendering of the page, by only re-rendering the affected pagelet
and its children.

### Installation

The XHR plugin is released to npm and can be installed using:

```bash
npm install --save bigpipe-xhr
```

### Usage

To use the plugin from BigPipe, simply add it after BigPipe is initialized or
add it to options#plugins. `bigpipe.use` will execute the plugin logic. Make sure
the plugin name is unique, e.g. `xhr` by default.

```js
var xhr = require('bigpipe-xhr')
  , Pipe = require('bigpipe');

var pipe = new Pipe(http.createServer(), {
  pages: __dirname + '/pages',
  public: __dirname + '/public',
  plugins: [ xhr ]
}).listen(8080);
```

## Server API

The plugin adds the following method to the server.

#### Pagelet.plain()

Proxy method that will set the response header `plain` to `true`. This will
immediatly write data to the response and close the connection. The header
ensures the client side template is not re-rendered. Instead, data is directly
provided to the client side callback. Usage of this method is only required
if you want to prevent client side rendering, use [pagelet.end][end] otherwise.

```js
require('pagelet').extend({
  post: function post(fields, files) {
    this.plain({
      name: 'some title',
      desc: 'custom description'
    });
  }
});
```

### Client API

The examples assume a browser environment and that the plugin is used
with the [BigPipe] framework. The callback will receive an error if the
response returned an error or if the `statusCode >= 400`.

If the written content is a `string` the pagelet content will be replaced
with the `body`. If the written content is JSON of type `object` the
client-side template is re-rendered with that data.
**Rendering is only done if `response.headers.plain` is not `true`**.

#### Pagelet.xhr.get()

Execute a GET request to the provided `uri`. The content written to the response
will be used for rendering, see the [introduction].

```js
pipe.on('search:render', function render(pagelet) {
  document.getElementById('status').addEventListener('click', function get() {
    pagelet.xhr.get(
      '/status/102383',                           // uri
      function (error, response, body)            // callback
    });
  });
});
```

#### Pagelet.xhr.post()

Execute a POST request to the provided `uri` with optional JSON data. The
content written to the response will be used for rendering, see the
[introduction].

```js
pipe.on('search:render', function render(pagelet) {
  document.getElementById('form').addEventListener('submit', function submit() {
    pagelet.xhr.post(
      '/search',                                  // uri
      { query: 'input in form' },                 // JSON data
      function (error, response, body)            // callback
    });
  });
});
```

#### Pagelet.xhr.put()

Execute a PUT request to the provided `uri` with optional JSON data. The
content written to the response will be used for rendering, see the
[introduction].

```js
pipe.on('search:render', function render(pagelet) {
  document.getElementById('update').addEventListener('click', function update() {
    pagelet.xhr.put(
      '/user/update',                             // uri
      { username: 'peter' },                      // JSON data
      function (error, response, body)            // callback
    });
  });
});
```

#### Pagelet.xhr.delete()

Execute a DELETE request to the provided `uri`. The content written to the response
will be used for rendering, see the [introduction].

```js
pipe.on('search:render', function render(pagelet) {
  document.getElementById('delete').addEventListener('click', function delete() {
    pagelet.xhr.delete(
      '/user/102383',                             // uri
      function (error, response, body)            // callback
    });
  });
});
```

### Tests

```bash
npm run test
npm run coverage
```

### License

Bigpipe-xhr is released under MIT.

[Bigpipe]: http://bigpipe.io
[end]: http://bigpipe.io/#pageletend
[introduction]: #client-api
