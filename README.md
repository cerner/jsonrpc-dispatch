# JSONRPC

JSONRPC is a module for managing [JSONRPC](http://json-rpc.org) requests and
responses in JavaScript.

This implementation is agnostic of the transport mechanism to send and receive JSONRPC
messages.  This means it can be easily integrated with XMLHttpRequests, HTTPServer and postMessage cross domain messaging. A few of the feature included are:

* Async request/response support
* Callback handling for JSONRPC responses
* Method handling for JSONRPC requests
* Method not found handling

## Includng JSONRPC

Add JS-JSONRPC to your package.json

```
npm install jsonrpc --save
```

Require the JSONRPC constructor into the module.

```js
// mymodule.js
JSONRPC = require('jsonprc')
```
## Using JSONRPC

Create a JSONRPC instance and pass in an object with function handlers for all supported requests and notifications.

*Requests* are always passed an additional parameter ``next`` which takes 2 arguments (error, result).

```js
const jsonrpc = new JSONRPC({
  // Example request which adds x and y
  add: function(x,y, next) {
    next(null, x+y)
  },

  // Example request which divides x by y
  divide: function(x,y, next) {
    if (y==0) {
      next('cannot divide by zero')
      return
    }

    next(null, x/y)
  },

  // Example notification
  hello: function() {
    console.log('a notification occurred')
  }
})
```

### JSONRPC.request
http://www.jsonrpc.org/specification#request_object

Generates a JSONRPC request object. Request takes 3 parameters

* Method name
* Method parameters
* Callback function - The function to execute when the response is received. The function takes an error and a result. If error is present result will be null.  ``this`` references the context passed when handling the incoming response. See JSONRPC.handle for more information.

```js
const jsonrpc = new JSONRPC({})
const request = jsonrpc.request('foobar', ['biz', 'baz'], function(error, result) {
  // TODO: Handle result and error if present
})
```

Once the request object is created it can be sent to the JSONRPC service for handling.


### JSONRPC.notification
http://www.jsonrpc.org/specification#notification

Notifications are similar to requests but do not have any responses and thus have no need for a callback. Notifications take 2 parameters:

* Method name
* Method parameters

```
const jsonrpc = new JSONRPC({})
const notification = jsonrpc.request('foobar', ['biz', 'baz'])
```

Once the notification object is created it can be sent to the JSONRPC service for handling.


### JSONRPC.handle

Routes incoming messages to be handled as requests, responses or notifications. Handle takes 3 arguments

* message - The JSONRPC message to handle. Can be a request, response or notification
* context - The context to bind to the response or request handler upon invocation
* next - The function to execute when the JSONRPC response is ready. Only called for request messages.

```js

const jsonrpc = new JSONRPC({
  add: function(x, y, next) {
    next(null, x + y)
  }
})

const request = {
  id: '1',
  method: 'add',
  params: [1, 2],
  jsonrpc: '2.0'
}

jsonrpc.handle(request, {}, (response) => {
  console.log(response)
})

// { id: '1', jsonrpc: '2.0', result: 3 }
```

## Examples

### AJAX with jQuery

Here is an example usage using AJAX as a transport mechanism to call a JSONRPC service which handles adding 2 numbers together.

```js
// 1. Create new JSONRPC instance which only makes requests
const jsonrpc = new JSONRPC()

// 2. Create a request message
const request = jsonrpc.request('add', [1,2], function(err, result) {
  console.log('1 + 2 = ', result)
})

// 3. Post the JSONRPC message to a server for processing,
$.post('/jsonrpc-service', request, jsonrpc.handle.bind(jsonrpc), 'json')
```
