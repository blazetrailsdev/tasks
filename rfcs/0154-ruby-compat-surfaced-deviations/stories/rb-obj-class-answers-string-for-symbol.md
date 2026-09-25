---
title: "rbObjClass answers String for a colon-prefixed Symbol; MRI answers Symbol"
status: draft
updated: 2026-09-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjClass` (`packages/ruby-compat/src/object.ts`, `rb_obj_class`, `vendor/ruby/object.c:296`) answers `"String"` for a Ruby Symbol, which trails spells as a colon-prefixed string (`isSymbol`, `symbol.ts`). MRI answers `Symbol`. So every `undefined method 'x' for an instance of ${rbObjClass(obj)}` message names the wrong class for a Symbol receiver. trails#8088 had to add a dedicated Symbol arm to `toI` (`numeric.ts`) to get `undefined method 'to_i' for an instance of Symbol` (`ruby -e ':false.to_i'`). That arm is a workaround for this.

## Acceptance criteria

- [ ] `rbObjClass(":foo")` returns `"Symbol"`, via an `isSymbol` arm before the `typeof x === "string"` arm, matching `rb_obj_class`.
- [ ] `toI`'s dedicated Symbol throw folds back into the generic `rbObjClass` message, with a string arm that excludes Symbols.
- [ ] Audit the `rbObjClass` callers that compare against `"String"`, so a colon-prefixed value is no longer mis-dispatched.
