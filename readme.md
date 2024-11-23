# Nuxt `useAsyncData` Wrapper

Utility for wrapping Promise-based functions with Nuxt's `useAsyncData`, simplifying integration with Nuxt's reactivity and server-side rendering capabilities.

[![npm version](https://img.shields.io/npm/v/nuxt-use-async-data-wrapper.svg)](https://www.npmjs.com/package/nuxt-use-async-data-wrapper)
[![license](https://img.shields.io/npm/l/nuxt-use-async-data-wrapper.svg)](https://github.com/leynier/nuxt-use-async-data-wrapper/blob/main/license)

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Wrapping an Object](#wrapping-an-object)
  - [Using Wrapped Functions](#using-wrapped-functions)
- [API Reference](#api-reference)
- [Examples](#examples)
  - [Function Without Arguments](#function-without-arguments)
  - [Function With Arguments](#function-with-arguments)
- [Options](#options)
- [Contributing](#contributing)
- [License](#license)

---

## Introduction

`nuxt-use-async-data-wrapper` is a utility that transforms an object containing Promise-returning functions into a set of functions compatible with Nuxt's `useAsyncData`. This allows for seamless integration with Nuxt's reactivity system and simplifies data fetching in your Nuxt applications.

Whether you're working with custom services, API clients, or any asynchronous functions, this utility helps you leverage `useAsyncData` without boilerplate code.

## Features

- **Automatic Wrapping**: Converts all Promise-returning functions into `useAsyncData` compatible functions.
- **Reactivity**: Automatically updates data when reactive parameters change.
- **Type Safety**: Written in TypeScript with comprehensive typings.
- **Customization**: Supports passing options to `useAsyncData` for advanced use cases.
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

## Usage

### Wrapping an Object

First, import the `useAsyncDataWrapper` function and wrap your object containing Promise-returning functions.

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

You can now use the wrapped functions in your Nuxt components with the benefits of `useAsyncData`.

```vue
<script setup lang="ts">
import { ref } from 'vue';

const id = ref(1);

// Function without arguments
const { data: dataList, pending: listPending, error: listError } = wrappedService.fetchData();

// Function with arguments
const { data: itemData, pending: itemPending, error: itemError } = wrappedService.getItem(() => [id.value]);

// Reactivity: when id.value changes, itemData updates automatically
</script>

<template>
  <div>
    <h1>Data List</h1>
    <div v-if="listPending">Loading...</div>
    <div v-else-if="listError">Error: {{ listError.message }}</div>
    <div v-else>
      <pre>{{ dataList }}</pre>
    </div>

    <h1>Item Data (ID: {{ id }})</h1>
    <input v-model="id" type="number" min="1" />
    <div v-if="itemPending">Loading...</div>
    <div v-else-if="itemError">Error: {{ itemError.message }}</div>
    <div v-else>
      <pre>{{ itemData }}</pre>
    </div>
  </div>
</template>
```

---

## API Reference

### `useAsyncDataWrapper<T>(obj: T): WrappedObject`

Transforms an object's Promise-returning functions into functions compatible with Nuxt's `useAsyncData`.

#### Type Parameters

- `T`: The type of the original object containing Promise-returning functions.

#### Parameters

- `obj: T`  
  The object containing functions that return Promises.

#### Returns

- `WrappedObject`  
  An object with the same function names as the original object, but wrapped to work with `useAsyncData`.

#### Example Usage

```typescript
const wrappedService = useAsyncDataWrapper(myService);
```

---

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
const { data, pending, error } = wrappedService.fetchData();
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

const { data, pending, error } = wrappedService.getItem(() => [id.value]);

// When id.value changes, data is automatically refreshed
```

---

## Options

You can pass options to `useAsyncData` through the wrapped functions to control their behavior.

### Example with Options

```typescript
const { data, pending, error } = wrappedService.fetchData({
  lazy: true,
  server: false,
  default: () => [],
});
```

#### Common Options

- `lazy`: If `true`, the data fetching is delayed until manually triggered.
- `server`: Controls whether to fetch data during server-side rendering.
- `default`: Provides a default value while data is loading.
- `watch`: Adds additional reactive dependencies.

---

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue. If you'd like to contribute code, feel free to submit a pull request.

### Steps to Contribute

1. **Fork the Repository**: Click on the "Fork" button at the top right of the repository page.

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

7. **Submit a Pull Request**: Go to the original repository and open a pull request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

- **Author**: Leynier Gutiérrez González
- **Email**: [leynier41@gmail.com](mailto:leynier41@gmail.com)
- **GitHub**: [@leynier](https://github.com/leynier)

---

Thank you for using `nuxt-use-async-data-wrapper`! If you find this package helpful, please consider giving it a star on GitHub.
