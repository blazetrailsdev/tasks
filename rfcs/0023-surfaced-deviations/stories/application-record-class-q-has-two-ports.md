---
title: "applicationRecordClassQ is ported twice; Rails declares it once in core.rb:121"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: ["application-record-class-q-in-wrong-file"]
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

Surfaced by #7115 (RFC 0121, activerecord enrollment) while writing the
`@noRailsEquivalent` receipt for each copy.

Rails declares `application_record_class?` exactly once, in
`vendor/rails/activerecord/lib/active_record/core.rb:121`
(`ActiveRecord::Core::ClassMethods`). trails has **two** ports of it:

- `packages/activerecord/src/base.ts:1513` — `static applicationRecordClassQ()`
- `packages/activerecord/src/inheritance.ts:649` — `export function applicationRecordClassQ(modelClass)`

Both re-enter the measured surface as of #7115 and each carries its own receipt
saying the other exists. Two copies of one Rails method is drift in its own
right, independent of the file-placement question already tracked by
[[application-record-class-q-in-wrong-file]] (which covers the fact that neither
copy lives in `core.ts`, where Rails puts it).

Resolving the two together is the cheaper order: converging the placement means
picking one copy anyway.

## Converged shape

One port, in `core.ts`, matching Rails' single definition in
`core.rb:121`. `base.ts`'s static is the natural survivor for callers that hold
the class; the `inheritance.ts` free function exists for callers that do not have
a `Base`-typed receiver, so whichever is kept must serve both — the
`this`-typed-function mixin idiom in CLAUDE.md covers exactly that shape.

Delete the loser's `@noRailsEquivalent` receipt with it: the survivor in
`core.ts` matches Rails and needs no receipt at all, so this converges two rows
out of the extra-surface ledger rather than rewording them.

## Acceptance criteria

- Exactly one `applicationRecordClassQ` remains, in the file Rails' layout
  implies (`core.ts`).
- Both receipts are gone rather than reworded.
- `pnpm parity:api:extra:gate` stays green with activerecord's marks moving DOWN
  or unchanged, and `pnpm parity:api` deltas are non-negative.
