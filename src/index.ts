/**
 * Error handler decorator
 * @param {Error|Function} typeOrLocalHandler class of Error or localHandler
 * @param {Function} localOrFinallyHandler local error handler (error, ctx, ...args) => {}
 * @param {Function} [finallyHandler] final handler (ctx, ...args) => {}
 *
 * Wraps around function, that needs to catch some errors
 * 
 * @example
 * This code:
 *   async someFunction() {
 *    try {
 *      await method();
 *    } catch(e) {
 *      console.log(e)
 *    } finally {
 *      console.log(this.var)
 *    }
 *   }
 *
 * becomes into:
 *
 * const getDataErrorHandler = (e, ctx) => { console.log(e) };
 * const getFinallyHandler = (ctx) => { console.log(ctx.var) };
 *
 * class HttpError extends Error {}
 *
 * @Catch(HttpError, getDataErrorHandler, getFinallyHandler)
 * async someFunction() {
 *    await method();
 * }
 *
 * or
 *
 * @Catch(getDataErrorHandler, getFinallyHandler)
 * async someFunction() {
 *    await method();
 * }
 *
 */
function Catch(typeOrLocalHandler, localOrFinallyHandler, finallyHandler) {
  // eslint-disable-next-line no-prototype-builtins
  const errorType = Error.isPrototypeOf(typeOrLocalHandler) ? typeOrLocalHandler : null;
  const localHandler = errorType ? localOrFinallyHandler : typeOrLocalHandler;
  finallyHandler = errorType ? finallyHandler : localOrFinallyHandler;
  
  return function wrapper(target, key, descriptor) {
    const originalMethod = descriptor.value;
  
    async function wrappedMethod(...args) {
      let result;
  
      try {
        result = await originalMethod.apply(this, args);
      } catch (error) {
        if (errorType && !(error instanceof errorType)) {
          throw error;
        } else if (localHandler) {
          result = await localHandler.call(null, error, this, ...args);
  
          if (result) {
            return result;
          }
        }
      } finally {
        if (finallyHandler) {
          result = await finallyHandler.call(null, this, ...args);
        }
      }
  
      return result;
    }
  
    Object.defineProperty(wrappedMethod, 'length', {
      value: originalMethod.length,
    });
  
    descriptor.value = wrappedMethod;
  
    return descriptor;
  };
}
  
export default Catch;
  