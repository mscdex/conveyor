var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;

function Conveyor(dest, opts) {
  if (!(this instanceof Conveyor))
    return new Conveyor(dest, opts);

  EventEmitter.call(this);

  var self = this;

  this._current = undefined;
  this._dest = dest;
  this._max = (opts && typeof opts.max === 'number' ? opts.max : Infinity);
  this._ending = false;
  this._manualEnd = false;
  this._streams = [];

  function resetState() {
    dest._writableState.finished = false;
    dest._writableState.ending = false;
    dest._writableState.ended = false;
    dest.writable = true;
    if (dest.readable) {
      dest._readableState.ended = false;
      dest._readableState.endEmitted = false;
      dest._readableState.flowing = false;
    }
  }

  dest.on('finish', function() {
    if (self._manualEnd) {
      self._manualEnd = false;
      return;
    }
    resetState();
    setImmediate(function() {
      resetState();
      if (Array.isArray(self._current)) {
        if (self._current.length === 2)
          self._current[1]();
        else {
          self._current[1].end();
          dest.unpipe(self._current[1]);
          self._current[0].unpipe(dest);
          if (self._current.length === 4)
            self._current[3]();
        }
      } else
        self._current.unpipe(dest);
      self._next();
    });
  });
}
inherits(Conveyor, EventEmitter);

Conveyor.prototype._next = function() {
  if (this._streams.length === 0) {
    this._current = undefined;
    if (this._ending) {
      this._ending = false;
      this._manualEnd = true;
      this._dest.end();
      this.emit('end');
    }
  } else {
    var stream = this._current = this._streams.shift();

    if (Array.isArray(stream)) {
      if (stream.length > 2)
        stream[0].pipe(this._dest).pipe(stream[1], stream[2]);
      else
        stream[0].pipe(this._dest);
    } else
      stream.pipe(this._dest);
  }
};

// args: source, dest, destPipeOpts
Conveyor.prototype._enqueue = function(method, args) {
  if (this._streams.length === this._max)
    return false;

  if (!args[0].readable)
    throw new Error('source stream must be readable');

  var cb = (typeof args[args.length - 1] === 'function'
            ? args[args.length - 1]
            : undefined);

  if (typeof this._dest.readable === 'boolean' && typeof args[1] === 'object') {
    if (cb)
      this._streams[method]([args[0], args[1], args[2], cb]);
    else
      this._streams[method]([args[0], args[1], args[2]]);
  } else {
    if (cb)
      this._streams[method]([args[0], cb]);
    else
      this._streams[method](args[0]);
  }

  if (!this._current)
    this._next();

  return true;
};

Conveyor.prototype.push = function() {
  return this._enqueue('push', arguments);
};

Conveyor.prototype.unshift = function() {
  return this._enqueue('unshift', arguments);
};

Conveyor.prototype.end = function() {
  this._ending = true;
  if (!this._current && this._streams.length === 0)
    this._next();
};

module.exports = Conveyor;
