---
title: "Credit the defineProperty loop that ports Rails' VALUE_METHODS generator so relation.rb's 55 faithful accessors stop scoring missing"
status: ready
updated: 2026-09-02
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 240
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

55 of `relation.rb`'s 82 missing methods are the `Relation::VALUE_METHODS`
accessor surface — every `*_values` / `*_value` / `*_clause` reader and writer
pair, plus the `extensions` alias.

Rails generates them in `class_eval` from the name list
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:162-186`,
`alias extensions extending_values` at `:185`; the list itself is
`relation.rb:54-65`). The reader is `@values.fetch(:name, DEFAULT)`, the writer
calls `assert_modifiable!` (`query_methods.rb:1746`) and then stores.

**trails already ports that generator faithfully.** `defineValueMethods`
(`packages/activerecord/src/relation/query-methods.ts:161-193`) loops the same
three lists, picks the same three suffixes and the same three defaults, and
installs an `Object.defineProperty` accessor pair whose getter is
`name in values ? values[name] : defaultValue()` — Ruby's `fetch`, not `??`,
which matters for a stored `null` — and whose setter calls
`assertModifiableBang` (`:1396`) before storing. `extensions` is installed the
same way at `:195`.

There is no divergence here to converge: this is bucket A. The extractor
harvests classes, exported functions, exported object literals and interfaces,
and models no generator, so it sees only the host-interface types
(`query-methods.ts:214-244`, `relation.ts:1855-1890`) and reports 55
declaration-only misses against a correct port.

The syntactic form is `Object.defineProperty(<Class>.prototype, <computed>,
{ get, set })` inside a loop, which is a different shape from the
`prototype[name] = fn` loop `credit-prototype-loop-generated-methods` handles;
each needs its own recognizer and its own tests, so they are separate stories.
Neither depends on the other.

## Acceptance criteria

- `extract-ts-api.ts` credits accessors installed by
  `Object.defineProperty(<Class>.prototype, name, descriptor)` inside a loop
  over a resolvable same-file list of string literals, as bodied members of
  that class, including a literal-named single call such as `extensions`.
- A getter-only descriptor credits a reader; a `get`/`set` pair credits the one
  member the compare layer maps Ruby's reader, predicate and writer onto.
- A test in `scripts/api-compare/` pins the negatives: a computed property name
  the arm cannot resolve to literals, and a `defineProperty` on a non-prototype
  receiver, credit nothing.
- activerecord `relation.rb` rises from **319/401 to ≥ 374/401**; package total
  ≥ **6215/6362** (from 6160).
- `defineValueMethods` keeps its loop — no hand-expanded accessor appears in
  the diff, and neither `defineValueMethods` nor its `@noRailsEquivalent
PERMANENT` receipt is disturbed.
- Effect on every other package reported in the PR body; marks move only via
  `:tighten`.

## Definition of done

Rewriting `defineValueMethods` into 55 hand-written accessors does not close this story, and neither does touching its `@noRailsEquivalent PERMANENT` receipt. The port is already correct; only the extractor is wrong.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api
pnpm vitest run scripts/api-compare/
```

Read the `relation.rb` row. `git diff -- packages/` must be empty.
