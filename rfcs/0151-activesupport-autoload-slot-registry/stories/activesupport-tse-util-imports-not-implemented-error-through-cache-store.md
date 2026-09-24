---
title: "activesupport: tse/util imports NotImplementedError via cache/store, closing a TDZ cycle that breaks message-pack entry imports"
status: in-progress
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: 9
pr: trails#8037
claim: "2026-09-24T16:14:54Z"
assignee: "activesupport-tse-util-imports-not-implemented-error-through-cache-store"
blocked-by: null
closed-reason: null
---

## Context

Importing the built `packages/activesupport/dist/message-pack/serializer.js` or
`dist/message-pack/cache-serializer.js` as an entry module throws a TDZ error:
`ReferenceError: Cannot access 'Serializer' before initialization` (or
`'CacheSerializer'`). The `@blazetrails/activesupport/message-pack` subpath only
works because its `index.ts` happens to enter the graph elsewhere, and
`activerecord/dist/encryption/message-pack-message-serializer.js` throws the
same way when it is the entry module.

The cycle, traced over runtime (non-`import type`) edges:

`message-pack/serializer.ts -> message-pack/extensions.ts -> hash-with-indifferent-access.ts -> hash-utils.ts -> xml-mini.ts -> core-ext/tse/util.ts -> cache/store.ts -> cache/serializer-with-fallback.ts -> message-pack/cache-serializer.ts (class CacheSerializer extends Serializer)`

The back-edge is invented. `core-ext/tse/util.ts:2` imports `NotImplementedError`
from `../../cache/store.js`, but Rails' `core_ext/erb/util.rb:172,183,189`
raises Ruby's core `NotImplementedError`, which trails ports as
`packages/ruby-compat/src/not-implemented-error.ts` (exported from
`@blazetrails/ruby-compat`, `index.ts:142`). `cache/store.ts` only re-exports it.

## Acceptance criteria

- `core-ext/tse/util.ts` imports `NotImplementedError` from `@blazetrails/ruby-compat`
  and no longer imports `cache/store.ts`.
- A plain-node import of each built `dist/message-pack/*.js` module, and of
  `activerecord/dist/encryption/message-pack-message-serializer.js`, succeeds
  as an entry module.
- No slot is added. A plain import fix is enough (CLAUDE.md § Call-time constant
  resolution: "do not reach for a slot when a plain import does not actually
  close a cycle").
