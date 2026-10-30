---
title: "rbObjClone takes a fast path for plain data fields, and Relation#clone uses it"
status: draft
updated: 2026-10-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjClone` (`packages/ruby-compat/src/include.ts`, `rb_obj_clone`, `vendor/ruby/v3.3.11/object.c:536`) copies a receiver through `copiedDescriptors` and `Object.defineProperties`, then dispatches `initializeClone`. Every receiver pays for the descriptor walk and the singleton-class handling, even a plain instance whose own properties are writable, enumerable, configurable data fields with no `extend()` registry.

`Relation#clone` (`packages/activerecord/src/relation.ts`) keeps a hand-written copy loop for that reason (trails#9482). Profiled on the $12 Server Challenge example (`GET /posts/250000`, trails#9425), `clone` through `rbObjClone` cost about 8% of self time (`rbObjClone` 4.3%, `copiedDescriptors` 3.2%, `initCopyHook` 0.5%), against 3.7% for the relation's fast path.

## Acceptance criteria

- `rbObjClone` takes a fast path for a receiver with no symbol-keyed own properties and only plain data fields: allocate with the receiver's prototype and copy by assignment where nothing on the chain defines the key, falling back to `defineProperty` otherwise, so no setter runs.
- `Relation#clone`'s hand-written copy loop, `_isPlaceholderField`, and the `@perf … CONVERGEABLE` tag are deleted, and `clone` is `rbObjClone(this)`.
- On the example app, `/posts/250000` CPU per request is no worse than with the relation fast path.
