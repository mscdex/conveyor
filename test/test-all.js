var path = require('path'),
    assert = require('assert'),
    Readable = require('stream').Readable,
    Writable = require('stream').Writable,
    Transform = require('stream').Transform,
    Conveyor = require('../lib/main');

var EMPTY_READFN = function(n) {};

var group = path.basename(__filename, '.js') + '/',
    tests,
    t = 0;

tests = [
  { test: function() {
      var mainstream = new Writable(), c, stream, result = '', self = this;
      mainstream._write = function(ch, enc, cb) {
        result += ch;
        cb();
      };
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(false, makeMsg(self, 'Unexpected Conveyor end'));
      });

      stream = new Readable();
      stream._read = EMPTY_READFN;
      stream.push('Hello');
      stream.push(' World');
      stream.push(null);
      c.push(stream, function() {
        assert(result === 'Hello World', makeMsg(self, 'Stream data mismatch'));
        ++t;
        next();
      });
    },
    what: 'Push single stream to Writable, with callback'
  },
  { test: function() {
      var mainstream = new Writable(), c, stream, result = '', self = this;
      mainstream._write = function(ch, enc, cb) {
        result += ch;
        cb();
      };
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(result === 'Hello World', makeMsg(self, 'Stream data mismatch'));
        ++t;
        next();
      });

      stream = new Readable();
      stream._read = EMPTY_READFN;
      stream.push('Hello World');
      stream.push(null);
      c.push(stream);
      c.end();
    },
    what: 'Push single stream to Writable, with explicit Conveyor end'
  },
  { test: function() {
      var mainstream = new Writable(), c, stream, result = '', self = this;
      mainstream._write = function(ch, enc, cb) {
        result += ch;
        cb();
      };
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(result === 'Hello World', makeMsg(self, 'Stream data mismatch'));
        ++t;
        next();
      });

      stream = new Readable();
      stream._read = EMPTY_READFN;
      stream.push('Hello World');
      setTimeout(function() {
        stream.push(null);
      }, 500);
      c.push(stream);
      c.end();
    },
    what: 'Push single stream to Writable, with explicit Conveyor end, delayed EOF'
  },
  { test: function() {
      var mainstream = new Writable(), c, stream, result = '', self = this;
      mainstream._write = function(ch, enc, cb) {
        result += ch;
        cb();
      };
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(result === 'Stream #1\nStream #2\nStream #3\nStream #4\n',
               makeMsg(self, 'Stream data mismatch'));
        ++t;
        next();
      });

      for (var i = 0; i < 4; ++i) {
        stream = new Readable();
        stream._read = EMPTY_READFN;
        stream.push('Stream #' + (i + 1) + '\n');
        stream.push(null);
        c.push(stream);
      }
      c.end();
    },
    what: 'Push multiple streams to Writable, with explicit Conveyor end'
  },
  { test: function() {
      var mainstream = new Writable(), c, stream, result = '', callbacks = 0,
          self = this;
      mainstream._write = function(ch, enc, cb) {
        result += ch;
        cb();
      };
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(false, makeMsg(self, 'Unexpected Conveyor end'));
      });

      for (var i = 0; i < 4; ++i) {
        stream = new Readable();
        stream._read = EMPTY_READFN;
        stream.push('Stream #' + (i + 1) + '\n');
        stream.push(null);
        c.push(stream, function() {
          if (++callbacks === 4) {
            assert(result === 'Stream #1\nStream #2\nStream #3\nStream #4\n',
                   makeMsg(self, 'Stream data mismatch'));
            ++t;
            next();
          }
        });
      }
    },
    what: 'Push multiple streams to Writable, with callbacks'
  },
  { test: function() {
      var mainstream = new Transform(), c, stream, result = '', self = this;
      mainstream._transform = function(ch, enc, cb) {
        this.push(ch);
        cb();
      };
      mainstream.on('data', function(d) {
        result += d;
      });
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(false, makeMsg(self, 'Unexpected Conveyor end'));
      });

      stream = new Readable();
      stream._read = EMPTY_READFN;
      stream.push('Hello');
      stream.push(' World');
      stream.push(null);
      c.push(stream, function() {
        assert(result === 'Hello World', makeMsg(self, 'Stream data mismatch'));
        ++t;
        next();
      });
    },
    what: 'Push single stream to Transform, with callback'
  },
  { test: function() {
      var mainstream = new Transform(), c, stream, result = '', self = this;
      mainstream._transform = function(ch, enc, cb) {
        this.push(ch);
        cb();
      };
      mainstream.on('data', function(d) {
        result += d;
      });
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(result === 'Hello World', makeMsg(self, 'Stream data mismatch'));
        ++t;
        next();
      });

      stream = new Readable();
      stream._read = EMPTY_READFN;
      stream.push('Hello');
      stream.push(' World');
      stream.push(null);
      c.push(stream);
      c.end();
    },
    what: 'Push single stream to Transform, with explicit Conveyor end'
  },
  { test: function() {
      var mainstream = new Transform(), c, stream, result = '', self = this;
      mainstream._transform = function(ch, enc, cb) {
        this.push(ch);
        cb();
      };
      mainstream.on('data', function(d) {
        result += d;
      });
      c = new Conveyor(mainstream);
      c.on('end', function() {
        assert(result === 'Stream #1\nStream #2\nStream #3\nStream #4\n',
               makeMsg(self, 'Stream data mismatch'));
        ++t;
        next();
      });

      for (var i = 0; i < 4; ++i) {
        stream = new Readable();
        stream._read = EMPTY_READFN;
        stream.push('Stream #' + (i + 1) + '\n');
        stream.push(null);
        c.push(stream);
      }
      c.end();
    },
    what: 'Push multiple streams to Transform, with explicit Conveyor end'
  },
  { test: function() {
      var mainstream = new Transform(), c, stream, result = '', callbacks = 0,
          self = this;
      mainstream._transform = function(ch, enc, cb) {
        this.push(ch);
        cb();
      };
      mainstream.on('data', function(d) {
        result += d;
      });
      c = new Conveyor(mainstream);

      for (var i = 0; i < 4; ++i) {
        stream = new Readable();
        stream._read = EMPTY_READFN;
        stream.push('Stream #' + (i + 1) + '\n');
        stream.push(null);
        c.push(stream, function() {
          if (++callbacks === 4) {
            assert(result === 'Stream #1\nStream #2\nStream #3\nStream #4\n',
                   makeMsg(self, 'Stream data mismatch'));
            ++t;
            next();
          }
        });
      }
    },
    what: 'Push multiple streams to Transform, with callbacks'
  },
  { test: function() {
      var mainstream = new Transform(), c, stream, result = '', callbacks = 0,
          self = this;
      mainstream._transform = function(ch, enc, cb) {
        this.push(ch);
        cb();
      };
      mainstream.on('data', function(d) {
        result += d;
      });
      c = new Conveyor(mainstream);

      for (var i = 0; i < 4; ++i) {
        stream = new Readable();
        stream._read = EMPTY_READFN;
        stream.push('Stream #' + (i + 1) + '\n');
        stream.push(null);
        c.unshift(stream, function() {
          if (++callbacks === 4) {
            assert(result === 'Stream #1\nStream #4\nStream #3\nStream #2\n',
                   makeMsg(self, 'Stream data mismatch'));
            ++t;
            next();
          }
        });
      }
    },
    what: 'Unshift multiple streams to Transform, with callbacks'
  },
  { test: function() {
      var mainstream = new Transform(), c, stream, result = '', callbacks = 0,
          self = this;
      mainstream._transform = function(ch, enc, cb) {
        this.push(ch);
        cb();
      };
      mainstream.on('data', function(d) {
        result += d;
      });
      c = new Conveyor(mainstream, { startPaused: true });

      for (var i = 0; i < 4; ++i) {
        stream = new Readable();
        stream._read = EMPTY_READFN;
        stream.push('Stream #' + (i + 1) + '\n');
        stream.push(null);
        c.unshift(stream, function() {
          if (++callbacks === 4) {
            assert(result === 'Stream #4\nStream #3\nStream #2\nStream #1\n',
                   makeMsg(self, 'Stream data mismatch'));
            ++t;
            next();
          }
        });
      }
      c.resume();
    },
    what: 'Unshift multiple streams to Transform, with callbacks and startup paused'
  },
  { test: function() {
      var mainstream = new Transform(), c, stream, self = this;
      mainstream._transform = function(ch, enc, cb) {
        cb();
      };
      c = new Conveyor(mainstream, { max: 2, startPaused: true });

      for (var i = 0; i < 3; ++i) {
        stream = new Readable();
        stream._read = EMPTY_READFN;
        if (i < 2)
          assert(c.push(stream) === true, makeMsg(self, 'Hit max too early'));
        else
          assert(c.push(stream) === false, makeMsg(self, 'Did not hit max'));
      }
      ++t;
      next();
    },
    what: 'Enforce max streams'
  },
];

function next() {
  if (t === tests.length)
    return;

  setImmediate(function() {
    tests[t].test.call(tests[t].what);
  });
}
next();

function makeMsg(what, msg) {
  return '[' + group + what + ']: ' + msg;
}

process.on('exit', function() {
  assert(t === tests.length, 'Only finished ' + t + '/' + tests.length + ' tests');
});
