---
title: "Comparator: record the Ruby receiver on CallSite so the built-in table compares it instead of stripping it"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6356
claim: "2026-08-11T13:26:07Z"
assignee: "naming-burndown-activerecord-rest-2"
blocked-by: null
closed-reason: null
---

## Context

`call-args-tool-builtin-receiver-as-first-arg` (PR #6351) shipped, but its
acceptance criterion 1 — "the Ruby receiver expression is compared against TS
argument 1" — was implemented as a receiver-STRIP, not a comparison, and the
deviation was justified at the call site (`stripBuiltinReceiver` in
`scripts/api-compare/call-args.ts`) and in the PR body.

Two reasons it could not be built as written:

1. `CallSite` (`scripts/parity/types.ts:25`) carries `name`, `args`, `flags` and
   no RECEIVER. Nothing to compare against.
2. Even with a receiver recorded, the sites the table exists for are CHAINED:
   `reflection.rb:454` writes `name.to_s.camelize`, whose receiver
   `extract-ruby-api.rb#describe_arg` would describe as the inner call
   (`call:to_s`), never as `name`, while the port correctly writes
   `camelize(name)` — a TS string is already a string. Comparing those two
   spellings would re-flag exactly the rows the story retired.

The consequence is a real, bounded blind spot: `RECEIVER_AS_FIRST_ARG`
(`scripts/api-compare/receiver-as-first-arg.ts`) matches purely by call NAME, so
`camelize(a)` where Rails wrote `b.camelize` reads as a match. The table is
restricted to Ruby built-ins and ActiveSupport core-exts on
Object/String/Symbol/Array/Hash — a Rails-defined name never qualifies, which is
what keeps the ~137 `call-args-ar-host-param-*` rows flagged — and all 60 rows
the strip retired were audited (every first TS argument is a plain string, hash,
array or scalar; none is a model or `klass` host). That audit is a one-time
check, not a standing guarantee.

## Converged shape

`CallSite` grows an optional `recv` descriptor, populated by
`extract-ruby-api.rb#record_call_site` (which already has `callee[1]` in hand for
the `inert_receiver?` verdict) and added to `EXTRACTOR_OUTPUT_FIELDS` in
`scripts/api-compare/extractor-schema.ts` so the ts-api cache token changes and
stale entries are evicted. `stripBuiltinReceiver` then COMPARES `recv` against
TS argument 1 when the receiver is a simple `id:`/`call:` ref, and falls back to
today's strip when it is a chain — the chained case being the one with no
agreeable spelling.

## Acceptance criteria

1. The Ruby receiver is recorded per call site and reaches the comparator.
2. For a `RECEIVER_AS_FIRST_ARG` name with a SIMPLE receiver, TS argument 1 is
   compared against it; a mismatched receiver flags.
3. A CHAINED receiver keeps today's strip, with the reason at the call site.
4. No row the PR #6351 audit cleared regresses: the delta is measured and any
   new row is a genuine divergence with a cited Rails `file:line`.
5. `pnpm parity:api:calls:args` green.
