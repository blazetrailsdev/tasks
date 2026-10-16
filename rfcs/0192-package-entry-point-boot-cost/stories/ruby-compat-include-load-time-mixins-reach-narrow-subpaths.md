---
title: "ruby-compat: include.ts's load-time mixins reach every narrow-subpath entry"
status: draft
updated: 2026-10-16
rfc: "0192-package-entry-point-boot-cost"
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

`packages/ruby-compat/src/include.ts:2039-2064` has load-time side effects that mirror MRI's `Init_*` work: it seats `Kernel`, `Enumerable`, `Comparable` (`vendor/ruby/v3.3.11/compar.c:315`) and `Rational` in `classpaths`; runs `include(rbCNumeric|rbCString|rbCTime|rbCDate, Comparable)` and `include(Hash, Enumerable)`; and sets `Rational`'s alloc func. Before trails#8995, `object.js` reached `include.js` through `variable.js`. After it, a consumer that imports only a narrow subpath through the new `./*` export (for example `/range`, `/name-error` or `/object`) never evaluates `include.js`. `rbModAncestors(String)`, `rbObjIsKindOf(str, Comparable)` and similar calls then answer differently than they do through the barrel.

The per-consumer migration stories in this RFC move call sites off the barrel. A migrated package that reads these mixins without also importing `include.js` changes behaviour silently, which is the risk named in the story notes of `ruby-compat-wildcard-subpath-export`.

## Acceptance criteria

- [ ] Every module whose call-time behaviour depends on `include.ts`'s load-time mixins (`rbModAncestors`, `rbObjIsKindOf`, `rbClassInheritedP`, …) loads `include.js` itself, or the dependency is converged so the mixin is in place wherever the class is defined (as MRI's `Init_Comparable` / `Init_String` order guarantees).
- [ ] A plain-node test (alongside `scripts/ruby-compat-entry-modules.test.ts`) asserts that, for each `dist/**/*.js` entry, `rbModAncestors(String)` includes Comparable once that entry has been imported alone.
- [ ] The migration stories in this RFC do not start until this lands (`deps`).
