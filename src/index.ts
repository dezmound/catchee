import isPromise from 'is-promise';

function isClass(v) {
  try {
    new v();
    return true;
  } catch(e) {
    return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
  }
}

/**
 * Create wrap around originalFunction with methods like 'catch'
 * or 'finally'. This methods add's error handlers to original function.
 * @param {Function} originalFunction
 * @param {any} context
 * 
 * @returns {any} originalFunction, catch handler return value
 */
export function Catchee(originalFunction: (...args: any) => any, context = null): any {
  const catchHandlers = [];
  let finallyHandler = null;
  function wrapper(...args) {
    let isHandled = false;
    let result: any | Promise<unknown> = undefined;

    function matchCatchHandler(error) {
      for (const { types, handler } of catchHandlers) {
        if (!Array.isArray(types) && types && !(error instanceof types)) {
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
              finallyHandler.apply(context || originalFunction, args);
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
export function Catch(
  typeOrLocalHandler: (Error | ((...args: any) => any) | string | (new () => any)),
  localOrFinallyHandler?: (((...args: any) => any) | string),
  finallyHandler?: (((...args: any) => any) | string),
): any {
  // eslint-disable-next-line no-prototype-builtins
  const errorType = Error.isPrototypeOf(typeOrLocalHandler) || isClass(typeOrLocalHandler) ? typeOrLocalHandler : null;
  let localHandler = errorType ? localOrFinallyHandler : typeOrLocalHandler;
  finallyHandler = errorType ? finallyHandler : localOrFinallyHandler;
  
  return function wrapper(target, key, descriptor) {
    const originalMethod = descriptor.value;

    if (typeof localHandler === 'string') {
      const methodName = localHandler as string;

      localHandler = target[methodName].bind(target);
    }

    if (typeof finallyHandler === 'string') {
      const methodName = finallyHandler as string;

      finallyHandler = target[methodName].bind(target);
    }
  
    function wrappedMethod(...args) {
      let result;

      const handleError = (error) => {
        if (errorType && !(error instanceof (errorType as any))) {
          throw error;
        } else if (localHandler) {
          result = (localHandler as any).call(null, error, this, ...args);
  
          if (result) {
            return result;
          }
        }
      };

      const finallyAction = () => {
        if (finallyHandler) {
          (finallyHandler as any).call(null, this, ...args);
        }
      };
  
      try {
        result = originalMethod.apply(this, args);

        if (isPromise(result) && (result as any).catch) {
          result = (result as any).catch(handleError);

          if ((result as any).finally) {
            result = (result as any).finally(finallyAction);
          }
        }
      } catch (error) {
        handleError(error);
      } finally {
        if (!result || (result && !(result as any).finally)) {
          finallyAction();
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
  