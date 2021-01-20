# catchee
Catchee is a simple decorator around function or class methods in JS, that allows you to write error handler chains around an exceptionable code.

# Usage

First install as dependency.
```
npm i -S catchee
```

Second import and use it 😎 .

```javascript
import { Catchee } from 'catchee';

const testFunction = (a, b) => {
  if (a < b) {
      throw new Error('A less than B :(');
  }
};

const wrappedFunction = Catchee(testFunction).catch((error, a, b) => {
  return `Oh, thats ok the result is ${a + b}`;
});

wrappedFunction(1, 2) == 'Oh, thats ok the result is 3';
```

You can use it for more complex cases:

```javascript

import { Catchee } from 'catchee';

class HttpError extends Error {}

const fetchData = async () => {
  const booksList = await fetch('/api/books');

  return booksList;
};

const wrappedFetch = Catchee(fetchData).catch(HttpError, () => {
  console.warn('Couldn\'t get books list via API, get it from local storage...');
  return JSON.parse(localStorage.getItem('books') || '[]');
})
.finally(() => {
  console.log('Books were loaded');
});

const books = await wrappedFunction();


```

### Class method handling

```javascript
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
```