---
title: "Hoist isRubyTruthy into activesupport and drop the duplicate implementations"
status: draft
updated: 2026-07-19
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

Ruby and JS disagree on falsiness: in Ruby only `nil` and `false` are falsey,
so `""` and `0` are truthy. Ports that translate a Ruby `&&` / `.any?` /
`.compact` guard with a bare JS truthiness check silently diverge.

There are now two independent, byte-identical implementations of the guard:

- `packages/activerecord/src/encryption/encrypted-attribute-type.ts:36`
  `isRubyTruthy` (private, from #4964)
- `packages/activesupport/src/i18n.ts` — the inline
  `.some((d) => d !== null && d !== undefined && d !== false)` predicate
  gating the options-considered message branch (#4969)

Both read `value !== null && value !== undefined && value !== false`. The
duplication was found during #4969 post-merge review. The activerecord copy
cannot be reused as-is: it is module-private, and the dependency direction
forbids `activesupport` importing from `activerecord`.

## Acceptance criteria

- [ ] A single exported `isRubyTruthy` helper lives in `@blazetrails/activesupport`
      (the bottom of the dependency graph), with the Ruby-vs-JS rationale in a
      comment.
- [ ] `encrypted-attribute-type.ts` imports it and drops its private copy.
- [ ] `packages/activesupport/src/i18n.ts` uses it in the `hasDefaults` predicate.
- [ ] Existing tests in both packages still pass; no behavior change intended.
- [ ] Grep for other bare-truthiness guards over ported Ruby conditionals and
      note (do not necessarily fix) any found.
