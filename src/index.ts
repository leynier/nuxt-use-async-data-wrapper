import { AsyncData, AsyncDataOptions, useAsyncData } from 'nuxt/app';
import { computed, unref } from 'vue';

/**
 * Type alias for the result returned by useAsyncData.
 * @template T - The type of the data returned by the function.
 */
type AsyncDataResult<T> = AsyncData<T, Error>;

/**
 * Transforms an object's Promise-returning functions into functions compatible with useAsyncData.
 *
 * Only includes functions that return Promises; other properties are excluded.
 *
 * For each function in the object:
 * - If the function returns a Promise and takes no arguments, it becomes a function that accepts optional AsyncDataOptions.
 * - If the function returns a Promise and takes arguments, it becomes a function that accepts an argsSupplier and optional AsyncDataOptions.
 *
 * @template T - The type of the object.
 */
export type AsyncDataWrapper<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => Promise<any>
    ? K
    : never]: T[K] extends (...args: infer Args) => Promise<infer R>
    ? Args extends []
      ? /**
         * Functions without arguments.
         * @param options - Optional AsyncDataOptions to configure useAsyncData.
         * @returns AsyncDataResult containing the data, status state, and error.
         */
        (options?: AsyncDataOptions<R>) => AsyncDataResult<R>
      : /**
         * Functions with arguments.
         * @param argsSupplier - A function that returns the arguments array for the original function.
         * @param options - Optional AsyncDataOptions to configure useAsyncData.
         * @returns AsyncDataResult containing the data, status state, and error.
         */
        (
          argsSupplier: () => Args,
          options?: AsyncDataOptions<R>,
        ) => AsyncDataResult<R>
    : never;
};

/**
 * Wraps an object's Promise-returning functions to integrate with Nuxt's useAsyncData.
 *
 * It transforms the functions of the provided object into functions that can be used within a Nuxt application,
 * leveraging the reactivity and data fetching capabilities of useAsyncData.
 *
 * @template T - The type of the object.
 * @param obj - The object containing functions that return Promises.
 * @returns An object with the same function names as the original object, but wrapped to work with useAsyncData.
 *
 * @example
 * ```typescript
 * const originalObject = {
 *   async fetchData() { ... },
 *   async getItem(id: number) { ... },
 * };
 * const wrappedObject = useAsyncDataWrapper(originalObject);
 * ```
 */
export function useAsyncDataWrapper<T extends Record<string, any>>(
  obj: T,
): AsyncDataWrapper<T> {
  const composable = {} as AsyncDataWrapper<T>;
  const functionNames = getFunctionNames(obj);
  for (const functionName of functionNames) {
    const originalFunction = obj[functionName].bind(obj);
    const wrappedFunction = getWrappedFunction(functionName, originalFunction);
    (composable as any)[functionName] = wrappedFunction;
  }
  return composable;
}

function getFunctionNames(obj: any): string[] {
  const functionNameSet = new Set<string>();
  let currentObj = obj;
  while (currentObj && currentObj !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(currentObj);
    for (const key of keys) {
      // Exclude constructor and non-function properties
      if (key !== 'constructor' && typeof currentObj[key] === 'function') {
        functionNameSet.add(key);
      }
    }
    currentObj = Object.getPrototypeOf(currentObj);
  }
  return Array.from(functionNameSet);
}

function getWrappedFunction(
  functionName: string,
  originalFunction: (...args: any[]) => Promise<any>,
): (...args: any[]) => AsyncDataResult<Promise<any>> {
  return (...args: any[]) => {
    if (typeof args[0] === 'function') {
      // Function with arguments: first argument is argsSupplier, second is options
      const argsSupplier = args[0];
      const options = args[1];
      return getWrappedFunctionWithArgs(
        functionName,
        originalFunction,
        argsSupplier,
        options!,
      );
    }
    // Function without arguments: options may be the first argument
    const options = args[0];
    return getWrapedFunctionWithoutArgs(
      functionName,
      originalFunction,
      options!,
    );
  };
}

function getWrappedFunctionWithArgs<T extends (...args: any[]) => Promise<any>>(
  functionName: string,
  originalFunction: T,
  argsSupplier: () => Parameters<T>,
  options: AsyncDataOptions<ReturnType<T>>,
): AsyncDataResult<ReturnType<T>> {
  // Reactive reference to arguments
  const argsRef = computed(() => argsSupplier!());
  // Unique key for useAsyncData
  const dataKeyRef = computed(
    () => `${functionName}-${JSON.stringify(argsRef.value)}`,
  );
  // Call useAsyncData with the generated key and function
  const asyncDataResult = useAsyncData(
    dataKeyRef.value,
    () => {
      const result = originalFunction(...unref(argsRef));
      // Ensure we return a Promise
      return result instanceof Promise ? result : Promise.resolve(result);
    },
    {
      // Re-execute when arguments change
      watch: [argsRef],
      // Spread additional options
      ...options,
    },
  );
  return asyncDataResult;
}

function getWrapedFunctionWithoutArgs<T extends () => Promise<any>>(
  functionName: string,
  originalFunction: T,
  options: AsyncDataOptions<ReturnType<T>>,
): AsyncDataResult<ReturnType<T>> {
  // For functions without arguments
  const asyncDataResult = useAsyncData(
    functionName,
    () => {
      const result = originalFunction();
      // Ensure we return a Promise
      return result instanceof Promise ? result : Promise.resolve(result);
    },
    {
      // Spread additional options
      ...options,
    },
  );
  return asyncDataResult;
}
