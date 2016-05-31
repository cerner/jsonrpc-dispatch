// http://www.jsonrpc.org/specification#error_object
PARSE_ERROR = Object.freeze({ message: 'Parse error', code: -32700 })
INVALID_REQUEST = Object.freeze({ message: 'Invalid request', code: -32600 })
METHOD_NOT_FOUND = Object.freeze({ message: 'Method not found', code: -32601 })
INVALID_PARAMS = Object.freeze({ message: 'Invalid params', code: -32602 })
INTERNAL_ERROR = Object.freeze({ message: 'Internal error', code: -32603 })

module.exports = Object.freeze({
  PARSE_ERROR: PARSE_ERROR,
  INVALID_REQUEST: INVALID_REQUEST,
  METHOD_NOT_FOUND: METHOD_NOT_FOUND,
  INVALID_PARAMS:  INVALID_PARAMS,
  INTERNAL_ERROR: INTERNAL_ERROR
})
