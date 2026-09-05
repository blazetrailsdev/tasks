---
title: "validate's all?(Symbol) guard is spelled as a bare string test"
status: draft
updated: 2026-09-05
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `validate-set-callback-narrows-options-and-wraps-filters` (PR #7514).

Rails guards the unknown-key check on every filter being a Symbol:

```ruby
if args.all?(Symbol)
```

`vendor/rails/activemodel/lib/active_model/validations.rb:163`

trails spells that guard as a bare string test
(`packages/activemodel/src/validations.ts:175`):

```ts
if (filters.every((arg) => typeof arg === "string")) {
```

A trails Ruby Symbol is a colon-prefixed string (`":checkEmptyTitle"`), per
CLAUDE.md's "A Ruby Symbol is a JS string, never a JS `Symbol`" rule, so the
JS reading of `all?(Symbol)` is `arg.startsWith(":")`, not `typeof arg ===
"string"`. As written the guard also fires for a bare non-Symbol string, where
Ruby's would not.

The divergence is currently unobservable from outside, because after #7514 a
bare string filter never reaches the chain — `CallTemplate.build`
(`packages/activesupport/src/callbacks.ts:265-269`, mirroring
`activesupport/lib/active_support/callbacks.rb:232-237`) rejects it. That makes
this a pure control-flow deviation of the kind RFC 0113 exists to catch: the
guard is spelled differently from Rails' and nothing measures it.

## Acceptance criteria

- [ ] The guard reads `filters.every((arg) => typeof arg === "string" &&
arg.startsWith(":"))`, the JS reading of `args.all?(Symbol)`
      (validations.rb:163).
- [ ] `validate(() => {}, { presence: true })` still does NOT raise and
      `validate(":title", { presence: true })` still raises the
      `Unknown key: :presence…` `ArgumentError` — the two arms
      `validations.trails.test.ts:2347-2364` already cover.
- [ ] parity:api / parity:test delta non-negative.
