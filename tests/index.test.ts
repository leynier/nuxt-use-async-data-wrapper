import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('nuxt/app', () => ({
  useAsyncData: vi.fn(() => ({
    data: ref(null),
    pending: ref(true),
    status: ref('pending'),
    error: ref(null),
    refresh: vi.fn(),
    execute: vi.fn(),
    clear: vi.fn(),
  })),
}));

import { useAsyncData } from 'nuxt/app';
import { useAsyncDataWrapper } from '../src';

const useAsyncDataMock = vi.mocked(useAsyncData);

interface CapturedCall {
  key: string;
  handler: (...args: any[]) => Promise<any>;
  options: Record<string, any>;
}

function lastCall(): CapturedCall {
  const call = useAsyncDataMock.mock.calls.at(-1);
  if (!call) {
    throw new Error('useAsyncData was not called');
  }
  return {
    key: call[0] as string,
    handler: call[1] as () => Promise<any>,
    options: (call[2] ?? {}) as Record<string, any>,
  };
}

describe('useAsyncDataWrapper', () => {
  beforeEach(() => {
    useAsyncDataMock.mockClear();
  });

  describe('function without arguments', () => {
    it('generates a key equal to the function name', () => {
      const wrapped = useAsyncDataWrapper({
        async list() {
          return [1, 2, 3];
        },
      });

      wrapped.list();

      expect(useAsyncDataMock).toHaveBeenCalledTimes(1);
      expect(lastCall().key).toBe('list');
    });

    it('prepends the keyPrefix to the key when provided', () => {
      const service = {
        async list() {
          return [];
        },
      };

      useAsyncDataWrapper(service, { keyPrefix: 'users' }).list();
      expect(lastCall().key).toBe('users-list');

      useAsyncDataWrapper(service, { keyPrefix: 'posts' }).list();
      expect(lastCall().key).toBe('posts-list');
    });

    it('avoids key collisions between two wrapped objects with equal function names', () => {
      const userService = {
        async list() {
          return 'users';
        },
      };
      const postService = {
        async list() {
          return 'posts';
        },
      };

      useAsyncDataWrapper(userService, { keyPrefix: 'users' }).list();
      const userKey = lastCall().key;
      useAsyncDataWrapper(postService, { keyPrefix: 'posts' }).list();
      const postKey = lastCall().key;

      expect(userKey).not.toBe(postKey);
    });

    it('accepts options as the first argument', () => {
      const wrapped = useAsyncDataWrapper({
        async list() {
          return [];
        },
      });

      wrapped.list({ lazy: true, server: false });

      const { options } = lastCall();
      expect(options.lazy).toBe(true);
      expect(options.server).toBe(false);
    });
  });

  describe('function with arguments', () => {
    it('generates a key based on the function name and arguments', () => {
      const wrapped = useAsyncDataWrapper({
        async getItem(id: number) {
          return { id };
        },
      });

      wrapped.getItem(() => [1]);
      const key = lastCall().key;
      expect(key.startsWith('getItem-')).toBe(true);

      wrapped.getItem(() => [2]);
      expect(lastCall().key).not.toBe(key);

      wrapped.getItem(() => [1]);
      expect(lastCall().key).toBe(key);
    });

    it('generates stable keys regardless of object key order', () => {
      const wrapped = useAsyncDataWrapper({
        async search(filter: Record<string, unknown>) {
          return filter;
        },
      });

      wrapped.search(() => [{ a: 1, b: 2 }]);
      const firstKey = lastCall().key;

      wrapped.search(() => [{ b: 2, a: 1 }]);
      expect(lastCall().key).toBe(firstKey);
    });

    it('generates distinct keys for Map and Set arguments', () => {
      const wrapped = useAsyncDataWrapper({
        async query(param: unknown) {
          return param;
        },
      });

      wrapped.query(() => [new Map([['a', 1]])]);
      const mapKey = lastCall().key;

      wrapped.query(() => [new Set([1, 2])]);
      const setKey = lastCall().key;

      expect(mapKey).not.toBe(setKey);

      wrapped.query(() => [new Map([['a', 1]])]);
      expect(lastCall().key).toBe(mapKey);

      wrapped.query(() => [new Map([['b', 2]])]);
      expect(lastCall().key).not.toBe(mapKey);
    });

    it('throws a TypeError when arguments contain circular references', () => {
      const wrapped = useAsyncDataWrapper({
        async query(param: unknown) {
          return param;
        },
      });

      const circular: Record<string, unknown> = { name: 'root' };
      circular.self = circular;

      expect(() => wrapped.query(() => [circular])).toThrow(TypeError);
      expect(() => wrapped.query(() => [circular])).toThrow(
        /circular references/,
      );
    });

    it('throws a TypeError when called without an argsSupplier', () => {
      const wrapped = useAsyncDataWrapper({
        async getItem(id: number) {
          return { id };
        },
      });

      expect(() => (wrapped.getItem as any)()).toThrow(TypeError);
      expect(() => (wrapped.getItem as any)({ lazy: true })).toThrow(
        /argsSupplier/,
      );
    });

    it('merges user watch sources with the internal args watcher', () => {
      const wrapped = useAsyncDataWrapper({
        async getItem(id: number) {
          return { id };
        },
      });

      const singleSource = ref(0);
      wrapped.getItem(() => [1], { watch: singleSource } as any);
      const singleWatch = lastCall().options.watch;

      expect(Array.isArray(singleWatch)).toBe(true);
      expect(singleWatch).toHaveLength(2);
      expect(singleWatch[0].value).toEqual([1]);
      expect(singleWatch[1]).toBe(singleSource);

      const firstSource = ref(0);
      const secondSource = ref(0);
      wrapped.getItem(() => [2], {
        watch: [firstSource, secondSource],
      } as any);
      const arrayWatch = lastCall().options.watch;

      expect(arrayWatch).toHaveLength(3);
      expect(arrayWatch[0].value).toEqual([2]);
      expect(arrayWatch[1]).toBe(firstSource);
      expect(arrayWatch[2]).toBe(secondSource);
    });

    it('does not let user options lose the internal watch when watch is absent', () => {
      const wrapped = useAsyncDataWrapper({
        async getItem(id: number) {
          return { id };
        },
      });

      wrapped.getItem(() => [1], { lazy: true } as any);
      const { options } = lastCall();

      expect(options.lazy).toBe(true);
      expect(Array.isArray(options.watch)).toBe(true);
      expect(options.watch[0].value).toEqual([1]);
    });
  });

  describe('object introspection', () => {
    it('does not invoke getters while wrapping', () => {
      let readCount = 0;
      const wrapped = useAsyncDataWrapper({
        get version() {
          readCount++;
          return '1.0.0';
        },
        async list() {
          return [];
        },
      });

      expect(readCount).toBe(0);
      expect(typeof (wrapped as any).list).toBe('function');
      expect((wrapped as any).version).toBeUndefined();
    });

    it('wraps methods declared on the prototype chain', () => {
      class Service {
        async list() {
          return [];
        }
      }

      const wrapped = useAsyncDataWrapper(new Service());
      expect(typeof wrapped.list).toBe('function');

      wrapped.list();
      expect(lastCall().key).toBe('list');
    });

    it('excludes non-function properties', () => {
      const wrapped = useAsyncDataWrapper({
        value: 42,
        async list() {
          return [];
        },
      });

      expect((wrapped as any).value).toBeUndefined();
      expect(typeof (wrapped as any).list).toBe('function');
    });
  });

  describe('synchronous functions (known limitation)', () => {
    it('still returns a Promise from the useAsyncData handler', async () => {
      const wrapped = useAsyncDataWrapper({
        compute() {
          return 42;
        },
      } as any);

      (wrapped.compute as any)();

      const { handler } = lastCall();
      const result = handler();
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe(42);
    });
  });
});
