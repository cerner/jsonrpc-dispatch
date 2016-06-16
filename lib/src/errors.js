'use strict';

// http://www.jsonrpc.org/specification#error_object
var PARSE_ERROR = Object.freeze({ message: 'Parse error', code: -32700 });
var INVALID_REQUEST = Object.freeze({ message: 'Invalid request', code: -32600 });
var METHOD_NOT_FOUND = Object.freeze({ message: 'Method not found', code: -32601 });
var INVALID_PARAMS = Object.freeze({ message: 'Invalid params', code: -32602 });
var INTERNAL_ERROR = Object.freeze({ message: 'Internal error', code: -32603 });

module.exports = Object.freeze({
  PARSE_ERROR: PARSE_ERROR,
  INVALID_REQUEST: INVALID_REQUEST,
  METHOD_NOT_FOUND: METHOD_NOT_FOUND,
  INVALID_PARAMS: INVALID_PARAMS,
  INTERNAL_ERROR: INTERNAL_ERROR
});