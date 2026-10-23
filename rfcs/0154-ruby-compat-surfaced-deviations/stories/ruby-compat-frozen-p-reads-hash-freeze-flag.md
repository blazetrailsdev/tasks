---
title: "ruby-compat-frozen-p-reads-hash-freeze-flag"
status: draft
updated: 2026-10-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjFrozenP` (`packages/ruby-compat/src/object.ts:111`) is `Object.isFrozen(obj)`. A ruby-compat `Hash` (a `Map`, which includes rack's `Headers`) keeps its frozen state in a private `#frozen` flag, set by `Hash#freeze` and read by `Hash#isFrozen` (`packages/ruby-compat/src/hash.ts:1119-1132`). `Object.isFrozen` never sees that flag. So `Rack::Lint::Wrapper#checkHeaders` (`packages/rack/src/lint.ts`, `if headers.frozen?`, `vendor/rack/v3.1.14/lib/rack/lint.rb:697`) passes a frozen `Headers`. The same goes for every other `frozen?` check written as `Object.isFrozen`. Since trails#9242, `checkHeaders` accepts a `Hash` through `rbObjIsKindOf(headers, Hash)`.

## Acceptance criteria

- [ ] `rbObjFrozenP` answers `Hash#isFrozen` for a `Hash` receiver, as `rb_obj_frozen_p` reads `FL_FREEZE` on any object (`vendor/ruby/v3.3.11/object.c:1301`).
- [ ] `checkHeaders` (and `checkEnvironment` / response `frozen?` checks in lint.ts) call `rbObjFrozenP`.
- [ ] A lint test asserts `"headers object should not be frozen, but is"` for `new Headers().freeze()`.
