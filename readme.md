# Nuxt `useAsyncData` Wrapper

Utility for wrapping Promise-based functions with Nuxt's `useAsyncData`,
simplifying integration with Nuxt's reactivity and server-side rendering
capabilities.

[![CI](https://github.com/leynier/nuxt-use-async-data-wrapper/actions/workflows/ci.yml/badge.svg)](https://github.com/leynier/nuxt-use-async-data-wrapper/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/nuxt-use-async-data-wrapper.svg)](https://www.npmjs.com/package/nuxt-use-async-data-wrapper)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/leynier/nuxt-use-async-data-wrapper/blob/main/license)

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Wrapping an Object](#wrapping-an-object)
  - [Using Wrapped Functions](#using-wrapped-functions)
  - [Important: Call Wrapped Functions During Setup](#important-call-wrapped-functions-during-setup)
- [API Reference](#api-reference)
  - [`useAsyncDataWrapper`](#useasyncdatawrapper)
  - [`UseAsyncDataWrapperOptions`](#useasyncdatawrapperoptions)
- [Examples](#examples)
  - [Function Without Arguments](#function-without-arguments)
  - [Function With Arguments](#function-without-arguments)
  - [Avoiding Key Collisions with `keyPrefix`](#avoiding-key-collisions-with-keyprefix)
- [Options](#options)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction

`nuxt-use-async-data-wrapper` is a utility that transforms an object containing
Promise-returning functions into a set of functions compatible with Nuxt's
`useAsyncData`. This allows for seamless integration with Nuxt's reactivity
system and simplifies data fetching in your Nuxt applications.

Whether you're working with custom services, API clients, or any asynchronous
functions, this utility helps you leverage `useAsyncData` without boilerplate
code.

## Features

- **Automatic Wrapping**: Converts all Promise-returning functions into
  `useAsyncData` compatible functions.
- **Reactivity**: Automatically updates data when reactive parameters change.
- **Stable Keys**: Generates collision-free `useAsyncData` keys from function
  names, a configurable prefix, and a stable serialization of the arguments
  (`Map`, `Set`, `Date`, and key ordering included).
- **Type Safety**: Written in TypeScript with comprehensive typings.
- **Customization**: Supports passing options to `useAsyncData` for advanced use
  cases, including merging custom `watch` sources with the internal argument
  watcher.
- **Ease of Use**: Simplifies data fetching in Nuxt applications.

## Installation

Install the package using [pnpm](https://pnpm.io/):

```bash
pnpm add nuxt-use-async-data-wrapper
```

Or using npm:

```bash
npm install nuxt-use-async-data-wrapper
```

Requirements: Nuxt 3+, Vue 3+, and Node.js 18+.

## Usage

### Wrapping an Object

First, import the `useAsyncDataWrapper` function and wrap your object containing
Promise-returning functions.

```typescript
// Import the wrapper function
import { useAsyncDataWrapper } from 'nuxt-use-async-data-wrapper';

// Assume you have an object with Promise-returning functions
const myService = {
  async fetchData() {
    // ...implementation
  },
  async getItem(id: number) {
    // ...implementation
  },
};

// Wrap your object
const wrappedService = useAsyncDataWrapper(myService);
```

### Using Wrapped Functions

You can now use the wrapped functions in your Nuxt components with the benefits
of `useAsyncData`.

```vue
<script setup lang="ts">
  import { ref } from 'vue';

  const id = ref(1);

  // Function without arguments
  const {
    data: dataList,
    status: listStatus,
    error: listError,
  } = wrappedService.fetchData();

  // Function with arguments
  const {
    data: itemData,
    status: itemStatus,
    error: itemError,
  } = wrappedService.getItem(() => [id.value]);

  // Reactivity: when id.value changes, itemData updates automatically
</script>

<template>
  <div>
    <h1>Data List</h1>
    <div v-if="listStatus === 'pending'">Loading...</div>
    <div v-else-if="listError">Error: {{ listError.message }}</div>
    <div v-else>
      <pre>{{ dataList }}</pre>
    </div>

    <h1>Item Data (ID: {{ id }})</h1>
    <input
      v-model="id"
      type="number"
      min="1" />
    <div v-if="itemStatus === 'pending'">Loading...</div>
    <div v-else-if="itemError">Error: {{ itemError.message }}</div>
    <div v-else>
      <pre>{{ itemData }}</pre>
    </div>
  </div>
</template>
```

### Important: Call Wrapped Functions During Setup

Wrapped functions call Nuxt's `useAsyncData` under the hood, so they must be
called during a component's `setup` (for example, at the top level of
`<script setup>`), not inside event handlers, `setTimeout` callbacks, or regular
functions called later. If you need to re-run a fetch later, use the returned
`refresh`/`execute` function instead of calling the wrapped function again.

## API Reference

### `useAsyncDataWrapper`

```typescript
function useAsyncDataWrapper<T extends Record<string, any>>(
  obj: T,
  wrapperOptions?: UseAsyncDataWrapperOptions,
): AsyncDataWrapper<T>;
```

Transforms an object's Promise-returning functions into functions compatible
with Nuxt's `useAsyncData`.

#### Type Parameters

- `T`: The type of the original object containing Promise-returning functions.

#### Parameters

- `obj: T` The object containing functions that return Promises.
- `wrapperOptions?: UseAsyncDataWrapperOptions` Optional wrapper options, such
  as a `keyPrefix`.

#### Returns

- `AsyncDataWrapper<T>` An object with the same function names as the original
  object, but wrapped to work with `useAsyncData`.

### `UseAsyncDataWrapperOptions`

- `keyPrefix?: string` Prefix prepended to every `useAsyncData` key generated by
  the wrapper (`${keyPrefix}-${functionName}`). Defaults to no prefix.

## Examples

### Function Without Arguments

```typescript
// Original function without arguments
async function fetchData() {
  // ...fetch data
}

// Wrap the function
const wrappedService = useAsyncDataWrapper({ fetchData });

// Use in a component
const { data, status, error } = wrappedService.fetchData();
```

### Function With Arguments

```typescript
// Original function with arguments
async function getItem(id: number) {
  // ...fetch item by id
}

// Wrap the function
const wrappedService = useAsyncDataWrapper({ getItem });

// Use in a component with reactive parameter
import { ref } from 'vue';

const id = ref(1);

const { data, status, error } = wrappedService.getItem(() => [id.value]);

// When id.value changes, data is automatically refreshed
```

### Avoiding Key Collisions with `keyPrefix`

`useAsyncData` keys are generated from the function name (plus the serialized
arguments for functions with arguments). If you wrap two objects that expose
functions with the same name, their keys would collide. Pass a `keyPrefix` to
namespace the keys of each wrapped object:

```typescript
const userService = useAsyncDataWrapper(
  {
    async list() {
      /* ... */
    },
  },
  { keyPrefix: 'users' },
); // key: "users-list"

const postService = useAsyncDataWrapper(
  {
    async list() {
      /* ... */
    },
  },
  { keyPrefix: 'posts' },
); // key: "posts-list"
```

---

## Options

You can pass options to `useAsyncData` through the wrapped functions to control
their behavior.

### Example with Options

```typescript
const { data, status, error } = wrappedService.fetchData({
  lazy: true,
  server: false,
  default: () => [],
});
```

#### Common Options

- `lazy`: If `true`, the fetch does not block client-side navigation (and
  non-blocking behavior during SSR); navigation happens immediately and data
  resolves in the background. If you want to skip the initial fetch entirely
  until you trigger it manually, use `immediate: false` instead.
- `server`: Controls whether to fetch data during server-side rendering.
- `default`: Provides a default value while data is loading.
- `watch`: Adds additional reactive dependencies. For functions with arguments,
  user-provided watch sources are merged with the internal argument watcher, so
  argument-driven refetching keeps working.

---

## Limitations

- **Wrapped functions must be called during setup**: this is an inherent
  restriction of Nuxt's `useAsyncData` (see above).
- **Synchronous functions are wrapped at runtime**: the wrapper discovers
  functions structurally and cannot tell whether a function returns a Promise
  without calling it. The TypeScript types only expose Promise-returning
  functions, but at runtime every function found on the object (own or
  inherited, excluding the constructor) is wrapped. The wrapped handler always
  resolves to a Promise, so synchronous functions still work through
  `useAsyncData`, but this is not covered by the type contract.
- **Keys depend on serializable arguments**: arguments are serialized with a
  stable algorithm (sorted object keys, `Map`, `Set`, `Date` ISO strings,
  function names). Arguments containing circular references throw a `TypeError`.
  Two distinct functions with the same name still collide unless you use
  `keyPrefix`.

---

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please
open an issue. If you'd like to contribute code, feel free to submit a pull
request.

### Steps to Contribute

1. **Fork the Repository**: Click on the "Fork" button at the top right of the
   repository page.

2. **Clone Your Fork**:

   ```bash
   git clone https://github.com/leynier/nuxt-use-async-data-wrapper.git
   ```

3. **Create a New Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**: Implement your feature or bug fix.

5. **Commit Your Changes**:

   ```bash
   git commit -am "Add new feature"
   ```

6. **Push to Your Fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**: Go to the original repository and open a pull
   request.

---

## License

This project is licensed under the MIT License - see the [license](license) file
for details.

---

## Contact

- **Author**: Leynier Gutiérrez González
- **Email**: [leynier41@gmail.com](mailto:leynier41@gmail.com)
- **GitHub**: [@leynier](https://github.com/leynier)

---

Thank you for using `nuxt-use-async-data-wrapper`! If you find this package
helpful, please consider giving it a star on GitHub.
