import isPromise from 'is-promise';

/**
 * Create wrap around originalFunction with methods like 'catch'
 * or 'finally'. This methods add's error handlers to original function.
 * @param {Function} originalFunction
 * @param {any} context
 * 
 * @returns {any} originalFunction, catch handler, or finally return value
 */
export function Catchee(originalFunction, context = null) {
  const catchHandlers = [];
  let finallyHandler = null;
  function wrapper(...args) {
    let isHandled = false;
    let result: any | Promise<unknown> = undefined;

    function matchCatchHandler(error) {
      for (const { types, handler } of catchHandlers) {
        if (types && !(error instanceof types)) {
          continue;
        } else if (Array.isArray(types) && !types.some((type) => error instanceof type)) {
          continue;
        }

        if (typeof handler === 'function') {
          result = handler.apply(context || originalFunction, [error, ...args]);
        }

        isHandled = true;
        break;
      }
    }

    try {
      result = originalFunction.apply(context || originalFunction, args);

      if (isPromise(result) || result.catch) {
        result = result
          .then((data) => {
            result = data;
          })
          .catch((error) => {
            matchCatchHandler(error);

            if (!isHandled) {
              throw error;
            }
          })
          .then(() => {
            if (finallyHandler) {
              result = finallyHandler.apply(context || originalFunction, args);
            }

            return result;
          });
      }
    } catch(error) {
      matchCatchHandler(error);

      if (!isHandled) {
        throw error;
      }
    } finally {
      if (typeof finallyHandler === 'function') {
        result = finallyHandler.apply(context || originalFunction, args);
      }
    }

    return result;
  }

  wrapper.catch = (typesOrLocalHandler, localHandler = null) => {
    const errorTypes = localHandler ? typesOrLocalHandler : null;

    catchHandlers.push({
      types: errorTypes,
      handler: localHandler || typesOrLocalHandler,
    });

    return wrapper;
  };

  wrapper.finally = (handler) => {
    finallyHandler = handler;

    return wrapper;
  };

  return wrapper;
}

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
export function Catch(typeOrLocalHandler, localOrFinallyHandler, finallyHandler) {
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
  