---
title: "argumentError() helper returns a name-stamped Error, so instanceof ArgumentError fails at 63 call sites"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
deps: []
deps-rfc: []
est-loc: 120
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5733 (`restore-rfc0072-verified-model-divergences`). Routing
`Relation#update`'s by-id form through `model.update` (relation.rb:620-636)
moved the "you are passing an instance of ActiveRecord::Base" raise from
`relation.ts` into `Base.performClassUpdate`, and the ported test
`update on relation passing active record object is not permitted`
(`packages/activerecord/src/relation/update-all.test.ts`) immediately failed
with `expected error to be instance of ArgumentError`.

Cause: `argumentError()` (`packages/activerecord/src/relation/query-methods.ts:1102-1106`)
does not construct the ported `ArgumentError` class — it returns a bare `Error`
with `name` stamped to `"ArgumentError"`:

```ts
export function argumentError(message: string): Error {
  const err = new Error(message);
  err.name = "ArgumentError";
  return err;
}
```

The real class is `ArgumentError` in
`packages/activemodel/src/attribute-assignment.ts:247`, exported from
`@blazetrails/activemodel`. Rails raises the actual `ArgumentError` constant
everywhere (e.g. persistence.rb:132-165), so any `instanceof ArgumentError`
assertion — which is how ported tests express `assert_raises ArgumentError` —
fails against helper-produced errors. Message and `name` match, so this is
invisible until a throw site is reached by a test that checks the class.

PR #5733 converted only the eight throw sites inside `performClassUpdate`
(`base.ts`) to `new ArgumentError(...)`. **63 other call sites remain**, across
`core.ts`, `base.ts` (4 remaining: ~2483, 2527, 4040, 4048), `relation.ts`,
`relation/query-methods.ts`, `relation/predicate-builder.ts`,
`relation/spawn-methods.ts`, `disable-joins-association-relation.ts`, and
`associations/disable-joins-association-scope.ts`. That file now mixes both
idioms, which is itself a trap for the next reader.

This is the helper-level fix for a deviation previously patched one site at a
time (`assert-valid-keys-argumenterror-type`,
`derive-fk-query-constraints-argumenterror-type`,
`request-variant-writer-argumenterror-type`, etc.).

## Acceptance criteria

- `argumentError()` returns a real `ArgumentError` instance (either by
  constructing the activemodel class, or by deleting the helper and converting
  its call sites), so `instanceof ArgumentError` holds at every site.
- Watch for an import cycle: `relation/query-methods.ts` is imported very
  early; if importing `ArgumentError` from `@blazetrails/activemodel` there
  breaks module init, relocate the helper rather than leaving the bare-`Error`
  behaviour in place.
- `base.ts` no longer mixes `argumentError(...)` and `new ArgumentError(...)`.
- No test renames. Ported tests asserting `ArgumentError` keep passing; run at
  minimum `relation/update-all.test.ts`, `relation/where.test.ts`,
  `relations.test.ts`, `core.test.ts`, and `spawn-methods`-adjacent suites.
- `pnpm parity:api` and `pnpm parity:test` deltas non-negative.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
