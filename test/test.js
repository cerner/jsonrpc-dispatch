/* global describe, it */
import { expect } from 'chai';
import JSONRPC from '../src/index';
import ERRORS from '../src/errors';


describe('JSONRPC', () => {
  it('should not be extensible', () => expect(JSONRPC).to.not.be.extensible);

  describe('#constructor', () => {
    const methods = { foo() {} };
    const dispatcher = () => {}
    const jsonrpc = new JSONRPC(dispatcher, methods);

    it('sets the version', () => expect(jsonrpc.version).to.equal('2.0'));
    it('sets the methods', () => expect(jsonrpc.methods).to.equal(methods));
    it('sets the deferreds', () => expect(jsonrpc.deferreds).to.be.an('object'));
    it('sets the dispatcher', () => expect(jsonrpc.dispatcher).to.equal(dispatcher));
  });

  describe('#notification', () => {
    const jsonrpc = new JSONRPC((notification) => {
      it('has an id', () => expect(notification.id).to.equal(undefined));
      it('has a jsonrpc version', () => expect(notification.jsonrpc).to.equal(jsonrpc.version));
      it('has a method', () => expect(notification.method).to.equal('foo'));
      it('has params', () => {
        expect(notification.params).to.have.lengthOf(1);
        expect(notification.params[0]).to.equal('hi');
      });
    }, {});

    jsonrpc.notification('foo', ['hi']);
  });

  describe('#request', () => {
    const jsonrpc = new JSONRPC((request) => {
      it('has a jsonrpc version', () => expect(request.jsonrpc).to.equal(jsonrpc.version));
      it('has a method', () => expect(request.method).to.equal('foo'));
      it('has a unique id', () => {
        expect(request.id).to.be.a('string');
        expect(request.id).to.have.lengthOf(36);
      });

      it('has params', () => {
        expect(request.params).to.have.lengthOf(1);
        expect(request.params[0]).to.equal('hi');
      });

      it('stores the deferred', () => {
        const deferred = jsonrpc.deferreds[request.id]
        expect(deferred).to.be.an('object');
        expect(deferred.resolve).to.be.a('function');
        expect(deferred.reject).to.be.a('function');
      });
    });

    const promise = jsonrpc.request('foo', ['hi']);
    it('returns a promise', () => expect(promise).to.be.an('promise'));
  });

  describe('#handleRequest', () => {
    const methods = { add(x, y) { return Promise.resolve(x + y); }};

    it('responds with JSONRPC response', (done) => {
      const request = { id: 1111, method: 'add', params: [1,2], jsonrpc: '2.0' }
      const jsonrpc = new JSONRPC((response) => {
        expect(response.result).to.equal(3);
        expect(response.jsonrpc).to.equal(request.jsonrpc);
        expect(response.id).to.equal(request.id);
        expect(response.error).to.equal(undefined);
        done();
      }, methods);

      jsonrpc.handleRequest(request);
    });


    it('handles unknown requests with a method not found error', (done) => {
      const request = { id: 2222, method: 'unknown', params: [1,2], jsonrpc: '2.0' }
      const jsonrpc = new JSONRPC((response) => {
        expect(response.result).to.equal(undefined);
        expect(response.id).to.equal(request.id);
        expect(response.error.code).to.equal(ERRORS.METHOD_NOT_FOUND);
        done();
      }, methods);

      jsonrpc.handleRequest(request);
    });
  });

  describe('#handleNotification', () => {
    it('executes the notification handler', () => {
      const request = { method: 'foo', params: ['bar', 'baz'] };
      const jsonrpc = new JSONRPC(() => {}, {
        foo(x, y) {
          expect(x).to.equal(request.params[0]);
          expect(y).to.equal(request.params[1]);
        }
      });

      jsonrpc.handleNotification(request);
    });

    it('handles unknown notifications silently', (done) => {
      const jsonrpc = new JSONRPC(() => {})
      jsonrpc.handleNotification({ method: 'foo', params: ['bar', 'baz'] });
      done()
    });
  });

  describe('#handleResponse', () => {

    it('executes the response handler', (done) => {
      const jsonrpc = new JSONRPC((request) => {
        jsonrpc.handleResponse({ id: request.id, result: 'foo' });
      });

      jsonrpc.request('foo').then((result) => {
        expect(result).to.equal('foo');
        done();
      })
    });

    it('passes errors to the response handler', (done) => {
      const error = { code: ERRORS.METHOD_NOT_FOUND }
      const jsonrpc = new JSONRPC((request) => {
        jsonrpc.handleResponse({ id: request.id, error});
      });

      jsonrpc.request('foo').catch((message) => {
        expect(message).to.equal(error)
        done();
      });
    });

    it('handles unknown responses silently', () => {
      const jsonrpc = new JSONRPC(() => {});
      jsonrpc.handleResponse({ id: 'abc123', result: 'foo' });
    });
  });

  describe('#handle', () => {
    it('handles notifications', () => {
      const request = { method: 'foo', params: ['bar', 'baz'] };
      const jsonrpc = new JSONRPC(() => {}, {
        foo(x, y) {
          expect(x).to.equal(request.params[0]);
          expect(y).to.equal(request.params[1]);
        }
      });

      jsonrpc.handle(request);
    });

    it('handles requests', () => {
      const methods = { add(x, y) { return Promise.resolve(x + y); }};
      const request = { id: 1111, method: 'add', params: [1,2], jsonrpc: '2.0' }
      const jsonrpc = new JSONRPC((response) => {
        expect(response.result).to.equal(3);
        expect(response.jsonrpc).to.equal(request.jsonrpc);
        expect(response.id).to.equal(request.id);
        expect(response.error).to.equal(undefined);
        done();
      }, methods);

      jsonrpc.handleRequest(request);
    });

    it('handles response', (done) => {
      const jsonrpc = new JSONRPC((request) => {
        jsonrpc.handleResponse({ id: request.id, result: 'foo' });
      });

      jsonrpc.request('foo').then((result) => {
        expect(result).to.equal('foo');
        done();
      })
    });
  });
});
