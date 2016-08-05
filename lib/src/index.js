'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _errors = require('./errors');

var _errors2 = _interopRequireDefault(_errors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JSONRPCVersion = '2.0';

/**
 * JSONRPC class based on the JSONRPC specification[0]. This object handles creating JSONRPC
 * requests and notification objects and managing callbacks.
 *
 * See also:
 * [0] JSONRPC - http://json-rpc.org/wiki/specification
 */

var JSONRPC = function () {
  /**
   * Initializes a JSONRPC instance..
   * @param {object} methods - The JSONRPC methods to handle.
   */
  function JSONRPC() {
    var methods = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, JSONRPC);

    this.version = JSONRPCVersion;
    this.callbacks = {};
    this.methods = methods;
  }

  /**
   * Create a notification object for the given method and params.
   *
   * @param {string} method - The RPC method to execute
   * @param {object[]} params - The parameters to execute with the method.
   */


  _createClass(JSONRPC, [{
    key: 'notification',
    value: function notification(method) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      return { method: method, params: params, jsonrpc: this.version };
    }

    /**
     * Create a request object for the given method and params and passes the result to
     * next(err, result).
     *
     * @param {string} method - The RPC method to execute
     * @param {object[]} params - The parameters to execute with the method.
     * @param {function(err, result)} callback - The function which is passed the result.
     *        If an error is present, result will be undefined.
     */

  }, {
    key: 'request',
    value: function request(method) {
      var params = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
      var callback = arguments.length <= 2 || arguments[2] === undefined ? function () {} : arguments[2];

      var request = { id: _nodeUuid2.default.v4(), method: method, params: params, jsonrpc: this.version };
      this.callbacks[request.id] = callback;
      return request;
    }

    /**
    * Handles a JSONRPC message.
    * @param {object} message - The JSONRPC message to handle.
    * @param {object} context - The context to apply RPC callback function.
    * @param {function} next - The function to execute with the JSONRPC response object.
    *                          Only executed for requests.
    */

  }, {
    key: 'handle',
    value: function handle(message, context, next) {
      // Requests and notifications have methods defined.
      if (message.method) {
        // Requests have ids
        if (message.id) {
          this.handleRequest(message, context, next);

          // Notifications have no ids
        } else {
          this.handleNotification(message, context);
        }

        // Responses have no methods, but have an id
      } else if (message.id) {
        this.handleResponse(message, context);
      }
    }

    /**
    * Handle a JSONRPC response object and execute the callback associated
    * to the response id..
    * @param {object} response - The JSONRPC response object to handle.
    * @param {object} context - The context to execute the callback within.
    */

  }, {
    key: 'handleResponse',
    value: function handleResponse(response, context) {
      var callback = this.callbacks[response.id];
      if (callback && typeof callback === 'function') {
        callback.apply(context, [response.error, response.result]);
        delete this.callbacks[response.id];
      }
    }

    /**
    * Handle a JSONRPC request object.
    * @param {object} request - The JSONRPC request object to handle.
    * @param {object} context - The context to execute the callback within.
    * @param {function(response)} next - A function taking the JSONRPC response object to
    *                                be executed when the result is received.
    * @return {obj} - A JSONRPC response for the given request.
    */

  }, {
    key: 'handleRequest',
    value: function handleRequest(request, context, next) {
      var method = this.methods[request.method];
      if (!method || typeof method !== 'function') {
        next({ id: request.id, error: _errors2.default.METHOD_NOT_FOUND });
        return;
      }

      var callback = function callback(error, result) {
        next({ jsonrpc: JSONRPCVersion, id: request.id, result: result, error: error });
      };
      var params = request.params ? [].concat(request.params, callback) : [callback];

      method.apply(context, params);
    }

    /**
    * Handle a JSONRPC notification.
    * @param {object} request - The JSONRPC notification object to handle.
    * @param {object} context - The context to execute the callback within.
    */

  }, {
    key: 'handleNotification',
    value: function handleNotification(request, context) {
      var method = this.methods[request.method];
      if (method && typeof method === 'function') {
        var params = request.params ? [].concat(request.params) : [];

        method.apply(context, params);
      }
    }
  }]);

  return JSONRPC;
}();

exports.default = Object.freeze(JSONRPC);