const { Catchee, AsyncCatchee } = require('../dist');
const assert = require('assert');

describe('Catchee API', function() {
  describe('#catch', function() {
    it('should catch single error', function() {
      const testFunction = (a, b) => {
        if (a < b) {
          throw new Error('A less than B :(');
        }
      };

      const wrappedFunction = Catchee(testFunction).catch(() => {
        return 'Oh, thats ok the result is 3';
      });

      assert.equal(wrappedFunction(1, 2), 'Oh, thats ok the result is 3');
    });

    it('should catch specific error', function() {
      class CustomError extends Error {}

      const testFunction = () => {
        throw new CustomError('Oh, no. Something went wrong! :(');
      };

      const wrappedFunction = Catchee(testFunction).catch(CustomError, () => {
        return 'Don\'t worry about it ;)';
      });

      assert.equal(wrappedFunction(), 'Don\'t worry about it ;)');
    });

    it('shouldn\'t catch custom error', function() {
      class CustomError extends Error {}
      class RuntimeError extends Error {}

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
        throw new Error('Oh, no. Something went wrong! :(');
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
        throw new Error('Oh, no. Something went wrong! :(');
      };

      const wrappedFunction = Catchee(testFunction).catch(Error, () => {
        return 'I can\'t handle it :(';
      });

      assert.doesNotThrow(wrappedFunction);
    });

    it('should return correct calculations', function() {
      const testFunction = (a, b) => {
        if (a < b) {
          throw new Error('A less than B :(');
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

          throw new Error('test');
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
});