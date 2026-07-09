---
title: "Destroy belongs_to preload scan resolves arrow-field helper methods, not just prototype methods"
status: ready
updated: 2026-07-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`expandCallbackSourcesWithHelpers` (`packages/activerecord/src/base.ts`, added
in PR #4809) makes the destroy-callback `belongs_to` preload scan resilient to
association reads reached through a helper method, but it only walks
`Object.getOwnPropertyNames(proto)` up the prototype chain to `Base.prototype`.
An arrow-function class field (`makeComments = async () => { ... this.person }`)
lives on the _instance_, not the prototype, so it is invisible to the scan. A
synchronous, un-awaited `belongs_to` read inside such a field, referenced from a
`before_destroy`/`around_destroy` callback, would not be preloaded — the sync
reader would then surface an unresolved Promise, the exact bug the preload
exists to prevent.

No current canonical fixture uses an arrow-field helper in a destroy-adjacent
path, so this is latent (flagged non-blocking in PR #4809 review), but the gap
is one indirection level deeper than the one PR #4809 closed.

## Acceptance criteria

- [ ] `expandCallbackSourcesWithHelpers` also folds in the source of
      instance-own function-valued properties (arrow-field methods) of the
      record being destroyed, not just prototype methods.
- [ ] A regression test exercises a model whose destroy callback reads a
      `belongs_to` synchronously through an arrow-function class field, asserting
      the association is preloaded (sync reader sees the value, not a Promise).
- [ ] Prototype-method resolution behavior is unchanged.
