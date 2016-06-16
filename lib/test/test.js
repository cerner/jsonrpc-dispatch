'use strict';

var _chai = require('chai');

var _index = require('../src/index');

var _index2 = _interopRequireDefault(_index);

var _errors = require('../src/errors');

var _errors2 = _interopRequireDefault(_errors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('JSONRPC', function () {
  it('should not be extensible', function () {
    return (0, _chai.expect)(_index2.default).to.not.be.extensible;
  });

  describe('#constructor', function () {
    var methods = {
      foo: function foo() {}
    };
    var jsonrpc = new _index2.default(methods);

    it('sets the version', function () {
      return (0, _chai.expect)(jsonrpc.version).to.equal('2.0');
    });
    it('sets the methods', function () {
      return (0, _chai.expect)(jsonrpc.methods).to.equal(methods);
    });
    it('sets the callbacks', function () {
      return (0, _chai.expect)(jsonrpc.callbacks).to.be.an('object');
    });
  });

  describe('#notification', function () {
    var jsonrpc = new _index2.default({});
    var notification = jsonrpc.notification('foo', ['hi']);
    it('has an id', function () {
      return (0, _chai.expect)(notification.id).to.equal(undefined);
    });
    it('has a jsonrpc version', function () {
      return (0, _chai.expect)(notification.jsonrpc).to.equal(jsonrpc.version);
    });
    it('hasa method', function () {
      return (0, _chai.expect)(notification.method).to.equal('foo');
    });
    it('has params', function () {
      (0, _chai.expect)(notification.params).to.have.lengthOf(1);
      (0, _chai.expect)(notification.params[0]).to.equal('hi');
    });
  });

  describe('#request', function () {
    var jsonrpc = new _index2.default({});
    var callback = function callback() {};
    var request = jsonrpc.request('foo', ['hi'], callback);

    it('has a jsonrpc version', function () {
      return (0, _chai.expect)(request.jsonrpc).to.equal(jsonrpc.version);
    });
    it('has a method', function () {
      return (0, _chai.expect)(request.method).to.equal('foo');
    });
    it('has a unique id', function () {
      (0, _chai.expect)(request.id).to.be.a('string');
      (0, _chai.expect)(request.id).to.have.lengthOf(36);
    });

    it('has params', function () {
      (0, _chai.expect)(request.params).to.have.lengthOf(1);
      (0, _chai.expect)(request.params[0]).to.equal('hi');
    });

    it('stores the callback', function () {
      (0, _chai.expect)(jsonrpc.callbacks[request.id]).to.equal(callback);
    });
  });

  describe('#handleRequest', function () {
    var jsonrpc = new _index2.default({
      add: function add(x, y, next) {
        next(null, x + y);
      },
      echoContext: function echoContext(next) {
        next(null, this);
      }
    });

    it('responds with JSONRPC response', function (done) {
      var request = new _index2.default().request('add', [1, 2]);
      var context = {};
      jsonrpc.handleRequest(request, context, function (response) {
        (0, _chai.expect)(response.result).to.equal(3);
        (0, _chai.expect)(response.jsonrpc).to.equal(request.jsonrpc);
        (0, _chai.expect)(response.id).to.equal(request.id);
        (0, _chai.expect)(response.error).to.equal(null);
        done();
      });
    });

    it('uses given context to call request handler', function (done) {
      var request = new _index2.default().request('echoContext');
      var context = { test: 'context' };
      jsonrpc.handleRequest(request, context, function (response) {
        (0, _chai.expect)(response.result).to.equal(context);
        done();
      });
    });

    it('handles unknown requests with a method not found error', function (done) {
      var request = new _index2.default().request('doesntExist', function () {});
      jsonrpc.handleRequest(request, {}, function (response) {
        (0, _chai.expect)(response.result).to.equal(undefined);
        (0, _chai.expect)(response.id).to.equal(request.id);
        (0, _chai.expect)(response.error).to.equal(_errors2.default.METHOD_NOT_FOUND);
        done();
      });
    });
  });

  describe('#handleNotification', function () {
    it('executes the notification handler', function (done) {
      var request = new _index2.default().notification('foo', ['bar', 'baz']);
      var context = {};
      var jsonrpc = new _index2.default({
        foo: function foo(x, y, next) {
          (0, _chai.expect)(x).to.equal('bar');
          (0, _chai.expect)(y).to.equal('baz');
          (0, _chai.expect)(this).to.equal(context);
          (0, _chai.expect)(next).to.equal(undefined);
          done();
        }
      });

      jsonrpc.handleNotification(request, context);
    });

    it('handles unknown notifications silently', function () {
      var request = new _index2.default().notification('foo');
      var jsonrpc = new _index2.default({});
      jsonrpc.handleNotification(request);
    });
  });

  describe('#handleResponse', function () {
    var jsonrpc = new _index2.default({});

    it('executes the response handler', function (done) {
      var context = { bar: 'baz' };
      var request = jsonrpc.request('foo', [], function f(error, result) {
        (0, _chai.expect)(this).to.equal(context);
        (0, _chai.expect)(error).to.equal(undefined);
        (0, _chai.expect)(result).to.equal('foo');
        done();
      });

      jsonrpc.handleResponse({ id: request.id, result: 'foo' }, context);
    });

    it('passes errors to the response handler', function (done) {
      var context = { bar: 'baz' };
      var request = jsonrpc.request('foo', [], function f(error, result) {
        (0, _chai.expect)(this).to.equal(context);
        (0, _chai.expect)(error).to.equal(_errors2.default.METHOD_NOT_FOUND);
        (0, _chai.expect)(result).to.equal(undefined);
        done();
      });

      jsonrpc.handleResponse({ id: request.id, error: _errors2.default.METHOD_NOT_FOUND }, context);
    });

    it('handles unknown responses silently', function () {
      jsonrpc.handleResponse({ id: 'abc123', result: 'foo' }, {});
    });
  });

  describe('#handle', function () {
    it('handles notifications', function (done) {
      var request = new _index2.default().notification('foo', ['bar', 'baz']);
      var context = {};
      var jsonrpc = new _index2.default({
        foo: function foo(x, y, next) {
          (0, _chai.expect)(x).to.equal('bar');
          (0, _chai.expect)(y).to.equal('baz');
          (0, _chai.expect)(this).to.equal(context);
          (0, _chai.expect)(next).to.equal(undefined);
          done();
        }
      });

      jsonrpc.handle(request, context);
    });

    it('handles requests', function (done) {
      var request = new _index2.default().request('add', [1, 2]);
      var context = {};
      var jsonrpc = new _index2.default({
        add: function add(x, y, next) {
          (0, _chai.expect)(x).to.equal(1);
          (0, _chai.expect)(y).to.equal(2);
          (0, _chai.expect)(this).to.equal(context);
          (0, _chai.expect)(next).to.be.a('function');
          next(undefined, x + y);
        }
      });

      function callback(response) {
        (0, _chai.expect)(response.result).to.equal(3);
        (0, _chai.expect)(response.jsonrpc).to.equal(request.jsonrpc);
        (0, _chai.expect)(response.id).to.equal(request.id);
        (0, _chai.expect)(response.error).to.equal(undefined);
        done();
      }

      jsonrpc.handle(request, context, callback);
    });

    it('handles response', function (done) {
      var jsonrpc = new _index2.default({});
      var context = { bar: 'baz' };
      var request = jsonrpc.request('foo', [], function callback(error, result) {
        (0, _chai.expect)(this).to.equal(context);
        (0, _chai.expect)(error).to.equal(undefined);
        (0, _chai.expect)(result).to.equal('foo');
        done();
      });

      jsonrpc.handle({ id: request.id, result: 'foo' }, context);
    });
  });
}); /* global describe, it */