---
title: "relation.ts re-spells has_limit_or_offset? inline at 7 sites instead of calling the getter"
status: done
updated: 2026-08-15
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6578
claim: "2026-08-15T21:15:04Z"
assignee: "converge-relation-has-limit-or-offset-call-sites"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `apply_join_dependency` in PR #6575, which replaced one such
site with the getter.

Rails calls `has_limit_or_offset?` (`relation.rb`, used at
`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:463`)
wherever it needs the test. trails has the getter at
`packages/activerecord/src/relation.ts` (`get hasLimitOrOffset`), whose body is
exactly `this._limitValue !== null || this._offsetValue !== null` — but seven
remaining sites in `relation.ts` re-spell that expression inline instead of
calling it, mostly as a `const hasLimitOrOffset = ...` local that shadows the
getter's name.

This is a call-set divergence the `parity:api:calls` gate cannot see, because
the inline copy makes no call at all.

## Converged shape

Every site reads `this.hasLimitOrOffset`, as Rails calls `has_limit_or_offset?`.
Delete the shadowing locals. One site — the `(this._offsetValue ?? 0) > 0`
variant in the `toArray` eager arm — differs from the getter (`> 0` vs
`!== null`); check Rails before folding it in, and if the difference is real,
keep it and note why at the call site rather than silently converging it.

## Acceptance criteria

- [ ] No remaining `_limitValue !== null || this._offsetValue !== null` spelling
      in `relation.ts` outside the `hasLimitOrOffset` getter itself.
- [ ] No local named `hasLimitOrOffset` shadowing the getter.
- [ ] Three adapters green.
