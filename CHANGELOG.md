# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-14

### Fixed

- Merged user-provided `watch` sources with the internal arguments watcher in
  wrapped functions with arguments. Previously, a user-supplied `watch` option
  overwrote the internal watcher and silently broke automatic refetching when
  arguments changed.
- Prevented `useAsyncData` key collisions when wrapping multiple objects that
  expose functions with the same name, via the new `keyPrefix` option.
- Replaced `JSON.stringify` with a stable argument serialization for key
  generation. Object keys are now sorted, and `Map`, `Set`, `Date`, functions,
  symbols, and primitives are handled explicitly, so equal arguments always
  produce equal keys.
- Added a clear `TypeError` when arguments contain circular references instead
  of an opaque stack overflow from `JSON.stringify`.
- Added a clear `TypeError` when a wrapped function that takes arguments is
  called without an `argsSupplier`.
- Stopped invoking getters while discovering function names on the wrapped
  object. Property descriptors are now inspected without triggering getter
  side effects.

### Added

- Optional `keyPrefix` option for `useAsyncDataWrapper` to namespace the keys
  generated for each wrapped function.
- Test suite based on Vitest.
- Continuous Integration workflow (Node 20/22) and npm release workflow with
  provenance and GitHub releases.

### Changed

- The package is now published as pure ESM (`"type": "module"`) with an
  `exports` map.
- Declared `engines.node` `>=18` and marked the package as side-effect free.
- Upgraded TypeScript `moduleResolution` from the deprecated `Node` to
  `Bundler`.

## [1.2.0] - 2024-11-23

- See [the 1.2.0 release](https://github.com/leynier/nuxt-use-async-data-wrapper/releases/tag/v1.2.0).
