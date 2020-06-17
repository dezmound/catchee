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

import { AsyncCatchee } from 'catchee';

class HttpError extends Error {}

const fetchData = async () => {
  const booksList = await fetch('/api/books');

  return booksList;
};

const wrappedFetch = AsyncCatchee(fetchData).catch(HttpError, () => {
  console.warn('Couldn\'t get books list via API, get it from local storage...');
  return JSON.parse(localStorage.getItem('books') || '[]');
})
.finally(() => {
  console.log('Books were loaded');
});

const books = await wrappedFunction();


```
