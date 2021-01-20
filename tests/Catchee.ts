import { Catchee, Catch } from '../src';
import * as assert from 'assert';
import { ExtendableError } from 'ts-error';

describe('Catchee API', function() {
  describe('#Catchee', function() {
    it('should catch single error', function() {
      const testFunction = (a, b) => {
        if (a < b) {
          throw new ExtendableError('A less than B :(');
        }
      };

      const wrappedFunction = Catchee(testFunction).catch(() => {
        return 'Oh, thats ok the result is 3';
      });

      assert.equal(wrappedFunction(1, 2), 'Oh, thats ok the result is 3');
    });

    it('should catch specific error', function() {
      class CustomError extends ExtendableError {}

      const testFunction = () => {
        throw new CustomError('Oh, no. Something went wrong! :(');
      };

      const wrappedFunction = Catchee(testFunction).catch(CustomError, () => {
        return 'Don\'t worry about it ;)';
      });

      assert.equal(wrappedFunction(), 'Don\'t worry about it ;)');
    });

    it('shouldn\'t catch custom error', function() {
      class CustomError extends ExtendableError {}
      class RuntimeError extends ExtendableError {}

      const testFunction = () => {
        throw new CustomError('Oh, no. Something went wrong! :(');
      };

      const wrappedFunction = Catchee(testFunction).catch(RuntimeError, () => {
        return 'Don\'t worry about it ;)';
      })
      .catch(() => {
        return 'That\'s bad...';
      });

      assert.equal(wrappedFunction(), 'That\'s bad...');
    });

    it('should return finally result', function() {
      const testFunction = () => {
        throw new ExtendableError('Oh, no. Something went wrong! :(');
      };

      const wrappedFunction = Catchee(testFunction)
      .catch(() => {
        return 'That\'s bad...';
      })
      .finally(() => {
        return 'That\'s ok :)';
      });

      assert.equal(wrappedFunction(), 'That\'s ok :)');
    });

    it('should throw exception', function() {
      const testFunction = () => {
        throw 'Oh, no. Something went wrong! :(';
      };

      const wrappedFunction = Catchee(testFunction).catch(Error, () => {
        return 'I can\'t handle it :(';
      });

      assert.throws(wrappedFunction);
    });

    it('shouldn\'t throw exception', function() {
      const testFunction = () => {
        throw new ExtendableError('Oh, no. Something went wrong! :(');
      };

      const wrappedFunction = Catchee(testFunction).catch(Error, () => {
        return 'I can\'t handle it :(';
      });

      assert.doesNotThrow(wrappedFunction);
    });

    it('should return correct calculations', function() {
      const testFunction = (a, b) => {
        if (a < b) {
          throw new ExtendableError('A less than B :(');
        }
      };

      const wrappedFunction = Catchee(testFunction).catch((error, a, b) => {
        return `Oh, thats ok the result is ${a + b}`;
      });

      assert.equal(wrappedFunction(1, 2), 'Oh, thats ok the result is 3');
    });

    it('should return async result', function () {
      const testFunction = (a, b) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(a + b);
          });

          throw new ExtendableError('test');
        });
      };

      const wrappedFunction = Catchee(testFunction).catch(Error, (error, a, b) => {
        return a + b;
      });

      return wrappedFunction(1, 2).then((result) => {
        assert.equal(result, 3);
      });
    });
  });
  describe('#Catch', function () {
    it('should catch class error through method name', async function() {
      class MethodError extends ExtendableError {}

      let err = null;

      class TestClass {
        @Catch(MethodError, 'methodErrorHandler')
        async method() {
          await new Promise((resolve, reject) => {
            err = new MethodError();
            reject(err);
          });
        }
        methodErrorHandler(error: MethodError) {
          assert.throws(
            () => {
              throw error;
            },
            err,
            'Catched error mismatch type of original exception'
          );

          return 'test';
        }
      }

      const instance = new TestClass();

      assert.equal(await instance.method(), 'test');

    });
    it('should exec finally method', async function() {
      class MethodError extends ExtendableError {}

      let err = null;
      let test = null;

      class TestClass {
        @Catch(MethodError, 'methodErrorHandler', 'finallyHandler')
        method() {
          err = new MethodError();
          throw err;
        }
        @Catch('methodErrorHandler', 'finallyHandler')
        async method2() {
          err = new Error();
          throw err;
        }
        methodErrorHandler(error: MethodError | Error) {
          return 'ok';
        }
        finallyHandler() {
          test = 'test';
        }
      }

      const instance = new TestClass();

      assert.equal(instance.method(), 'ok');
      assert.equal(await instance.method2(), 'ok');
      assert.equal(test, 'test');
    });
  });
});