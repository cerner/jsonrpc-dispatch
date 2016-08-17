import uuid from 'node-uuid';
import ERRORS from './errors';
const JSONRPCVersion = '2.0';


/**
 * JSONRPC class based on the JSONRPC specification[0]. This object handles creating JSONRPC
 * requests and notification objects and managing resolving responses.
 *
 * @see {@link  http://json-rpc.org/wiki/specification}
 */
class JSONRPC {
  /**
   * Initializes a JSONRPC instance.
   * @param {function} dispatcher - A function which takes a single argument for
   *                                the JSONRPC object to send to the RPC server.
   * @param {object} methods - The JSONRPC methods to handle.
   */
  constructor(dispatcher, methods = {}) {
    this.version = JSONRPCVersion;
    this.deferreds = {};
    this.methods = methods;
    this.dispatcher = dispatcher;
  }

  /**
   * Sends the given JSONPRC message using the dispatcher provided.
   * @param {object} message - A JSONPRC 2.0 message object.
   */
  send(message) {
    message = Object.assign({}, message)
    message.jsonrpc = this.version;

    this.dispatcher(message);
  }

  /**
   * Create a notification object for the given method and params.
   * @see {@link  http://www.jsonrpc.org/specification#notification|JSONRPC Notifications}
   *
   * @param {string} method - The RPC method to execute
   * @param {object[]} params - The parameters to execute with the method.
   * @returns {object} JSONRPC notification object
   */
  notification(method, params = []) {
    this.send({ method, params });
  }

  /**
   * Create a request object for the given method and params and passes the result to
   * next(err, result).
   * @see {@link  http://www.jsonrpc.org/specification#request_object|JSONRPC Requests}
   *
   * @param {string} method - The RPC method to execute
   * @param {object[]} params - The parameters to execute with the method.
   * @returns {Promise} which is resolved with the response value.
   */
  request(method, params = []) {
    return new Promise((resolve, reject) => {
      const id = uuid.v4();
      
      // Save the resolve/reject callbacks as a deferred. We do this because
      // the response may not occur within the scope of the dispatch method. Example
      // Cross-Domain messaging is sent over postMessage but received via the
      // message event.
      this.deferreds[id] = { resolve, reject };

      this.send({ id, method, params });
    });
  }

  /**
  * Handles a JSONRPC message for the following scenarios:
  * request - Executes the method defined and passes the result to dispatch
  * response - Resolves the promise associated with the id on the response
  * notification - Executes the method defined
  *
  * @param {object} message - The JSONRPC message to handle.
  */
  handle(message) {
    // Requests and notifications have methods defined.
    if (message.method) {
      // Requests have ids
      if (message.id) {
        this.handleRequest(message);

      // Notifications have no ids
      } else {
        this.handleNotification(message);
      }

    // Responses have no methods, but have an id
    } else if (message.id) {
      this.handleResponse(message);
    }
  }

  /**
  * Handle a JSONRPC response object and resolve the promise associated to the
  * originating request.
  * @param {object} response - The JSONRPC response object to handle.
  */
  handleResponse(response) {
    const deferred = this.deferreds[response.id];
    if (deferred === undefined) {
      return;
    }

    if (response.error) {
      deferred.reject(response.error);
    } else {
      deferred.resolve(response.result);
    }

    delete this.deferreds[response.id];
  }

  /**
  * Handle a JSONRPC request object and execute the method it specifies sending
  * the result to the dispatcher.
  * @param {object} request - The JSONRPC request object to handle.
  */
  handleRequest(request) {
    const method = this.methods[request.method];
    if (typeof method !== 'function') {
      const error = {
        message: `The method ${method} was not found.`,
        code: ERRORS.METHOD_NOT_FOUND,
      };
      this.send({ id: request.id, error });
      return;
    }
    // Success
    method.apply(request, request.params).then((result) => {
      this.send({ id: request.id, result });
    // Error
    }).catch((message) => {
      const error = { message, code: ERRORS.INTERNAL_ERROR };
      this.send({ id: request.id, error });
    });
  }

  /**
  * Handle a JSONRPC notification request and execute the method it specifies.
  * @param {object} request - The JSONRPC notification object to handle.
  */
  handleNotification(request) {
    const method = this.methods[request.method];
    if (method && typeof method === 'function') {
      method.apply(request, request.params);
    }
  }
}

export default Object.freeze(JSONRPC);
