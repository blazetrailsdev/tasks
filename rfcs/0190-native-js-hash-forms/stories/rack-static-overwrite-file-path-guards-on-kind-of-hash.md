---
title: "Rack::Static#overwrite_file_path guards on kind_of?(Hash), not on not-an-Array"
status: claimed
updated: 2026-10-13
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-13T17:54:06Z"
assignee: "activerecord-relocate-ts-only-tests-autosave-association"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Static#overwrite_file_path` is `@urls.kind_of?(Hash) && @urls.key?(path) || add_index_root?(path)` (`vendor/rack/v3.1.14/lib/rack/static.rb:113-115`).

The port (`packages/rack/src/static.ts:44-48`) writes the guard as `!Array.isArray(this.urls)`, the inverse of a different test: any non-Array `urls` passes, where Rack admits a Hash only. `route_file` (`static.rb:117-119`) has the matching `@urls.kind_of?(Array)` arm, and `can_serve` reads both. trails#8788 moved the `key?` half onto `Object.hasOwn(this.urls, path)` and left the guard as it was.

## Acceptance criteria

- [ ] The guard tests that `urls` is a hash (`isPlainObject` / `rbObjIsKindOf(this.urls, Hash)`, whichever the package already uses for `kind_of?(Hash)`), not that it is not an Array.
- [ ] `routeFile`'s `kind_of?(Array)` arm is checked against `static.rb:117-119` in the same pass.
- [ ] `packages/rack/src/static.test.ts` passes; `pnpm parity:api:calls` green with no baseline row added.
