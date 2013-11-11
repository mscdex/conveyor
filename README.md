
Description
===========

Feed multiple streams sequentially into one (Writable or Duplex stream).


Requirements
============

* [node.js](http://nodejs.org/) -- v0.10.0 or newer


Install
=======

    npm install conveyor


Examples
========

* Pass HTTP requests to an echo stream:

```javascript
var TransformStream = require('stream').Transform,
    http = require('http');

var Conveyor = require('conveyor');

var stream = new TransformStream();
stream._transform = function(chunk, encoding, cb) {
  this.push(chunk);
  cb();
};

var c = new Conveyor(stream),
    TOTAL = 10,
    count = 0;

http.createServer(function(req, res) {
  if (++count === TOTAL)
    this.close();
  c.push(req, res);
}).listen(8080, function() {
  for (var i = 0; i < TOTAL; ++i) {
    http.request({
      host: '127.0.0.1',
      port: 8080,
      method: 'POST'
    }, function(res) {
      var b = '';
      res.setEncoding('utf8');
      res.on('data', function(d) {
        b += d;
      }).on('end', function() {
        console.log(b);
      });
    }).end('Hello from request #' + (i + 1));
  }
});

// output:
// Hello from request #1
// Hello from request #2
// Hello from request #3
// Hello from request #4
// Hello from request #5
// Hello from request #6
// Hello from request #7
// Hello from request #8
// Hello from request #9
// Hello from request #10
```

* Pass HTTP requests to an Writable stream:

```javascript
var WritableStream = require('stream').Writable,
    http = require('http');

var Conveyor = require('conveyor');

var stream = new WritableStream();
stream._write = function(chunk, encoding, cb) {
  console.log(chunk.toString());
  cb();
};

var c = new Conveyor(stream),
    TOTAL = 10,
    count = 0;

http.createServer(function(req, res) {
  if (++count === TOTAL)
    this.close();
  c.push(req, function() {
    // this req stream finished
    res.end();
  });
}).listen(8080, function() {
  for (var i = 0; i < TOTAL; ++i) {
    http.request({
      host: '127.0.0.1',
      port: 8080,
      method: 'POST'
    }, function(res) {
      res.resume();
    }).end('Hello from request #' + (i + 1));
  }
});

// output (assuming 1-chunk requests):
// Hello from request #1
// Hello from request #2
// Hello from request #3
// Hello from request #4
// Hello from request #5
// Hello from request #6
// Hello from request #7
// Hello from request #8
// Hello from request #9
// Hello from request #10
```


API
===

_Conveyor_ is an _EventEmitter_

Conveyor (special) events
-------------------------

* **end**() - Emitted after end() is called and all streams have been processed.


Conveyor methods
----------------

* **(constructor)**(< _Writable_ >dest, < _object_ >config) - Creates and returns a new Dicer instance with the following valid `config` settings:

    * **max** - _integer_ - This is the max queue size.

* **push**(< _Readable_ >stream[, < _Writable_ >pipeStream][, < _object_ >pipeStreamOpts][, < _function_ >callback]) - _boolean_ - Pushes (appends) `stream` to the queue. If `pipeStream` is set, data (from `dest` passed to the constructor) will be piped to this stream with optional `pipeStreamOpts` pipe settings. `callback` is called once `stream` has ended and `dest` is drained. The return value is false if `stream` could not be enqueued due to the queue being full.

* **unshift**(< _Readable_ >stream[, < _Writable_ >pipeStream][, < _object_ >pipeStreamOpts][, < _function_ >callback]) - _boolean_ - Identical to push() except it unshifts (prepends) `stream` to the queue.
