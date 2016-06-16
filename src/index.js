import uuid from 'node-uuid';
import ERRORS from './errors';
const JSONRPCVersion = '2.0';


/**
 * JSONRPC class based on the JSONRPC specification[0]. This object handles creating JSONRPC
 * requests and notification objects and managing callbacks.
 *
 * See also:
 * [0] JSONRPC - http://json-rpc.org/wiki/specification
 */
class JSONRPC {
  /**
   * Initializes a JSONRPC instance..
   * @param {object} methods - The JSONRPC methods to handle.
   */
  constructor(methods = {}) {
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
  notification(method, params = []) {
    return { method, params, jsonrpc: this.version };
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
  request(method, params = [], callback = () => {}) {
    const request = { id: uuid.v4(), method, params, jsonrpc: this.version };
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
  handle(message, context, next) {
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
  handleResponse(response, context) {
    const callback = this.callbacks[response.id];
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
  handleRequest(request, context, next) {
    const method = this.methods[request.method];
    if (!method || typeof method !== 'function') {
      next({ id: request.id, error: ERRORS.METHOD_NOT_FOUND });
      return;
    }

    const callback = (error, result) => {
      next({ jsonrpc: JSONRPCVersion, id: request.id, result, error });
    };
    const params = request.params
      ? [].concat(request.params, callback)
      : [callback];

    method.apply(context, params);
  }

  /**
  * Handle a JSONRPC notification.
  * @param {object} request - The JSONRPC notification object to handle.
  * @param {object} context - The context to execute the callback within.
  */
  handleNotification(request, context) {
    const method = this.methods[request.method];
    if (method && typeof method === 'function') {
      const params = request.params
        ? [].concat(request.params)
        : [];

      method.apply(context, params);
    }
  }
}

export default Object.freeze(JSONRPC);
