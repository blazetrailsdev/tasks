---
title: "Converge http/cache.ts has* predicates onto the is* convention"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/http/cache.ts` exports three
predicates under a `has` prefix — `hasLastModified`, `hasDate`, `hasEtag` —
for Rails' `Cache::Response#last_modified?`, `#date?` and `#etag?`
(`vendor/rails/actionpack/lib/action_dispatch/http/cache.rb:75`, `:89`,
`:127`). `scripts/api-compare/conventions.ts` maps a Ruby `foo?` onto an
`is`-prefixed TS name, so all three land as novel extra surface: `pnpm
api:extra` reports `http/cache.ts — 3 novel` and they are the three.

This also has a second-order cost. In `significantMissingCalls`
(`scripts/api-compare/compare.ts:262-266`) a Ruby call is checked against
the TS body's call-set using the MAPPED candidates only. `last_modified?`
maps to `isLastModified` / `lastModified`, never to `hasLastModified` — so
`handleConditionalGetBang`, which does call `hasLastModified`, reads as
omitting the call. PR #5404 had to add a wide-call baseline entry for
`handle_conditional_get! → last_modified?` in
`scripts/api-compare/call-mismatches-wide-exclude/actiondispatch/http/cache.json`;
the sibling entry for `etag?` was already there for the same reason.

`Response` exposes `hasLastModified` / `hasDate` / `hasEtag` as getters
(`packages/actionpack/src/action-dispatch/http/response.ts`), and
`dispatch/response.test.ts` asserts through them.

## Acceptance criteria

- The three predicates are renamed to the convention-mapped `is` form, on
  both `cache.ts` and the `Response` prototype wiring + `declare`s.
- Call sites updated (`handleConditionalGetBang`, `isStrongEtag`,
  `response.test.ts`).
- `http/cache.ts` novel extra surface drops from 3 to 0.
- The `handle_conditional_get! → last_modified?` and `→ etag?` entries are
  REMOVED from the wide-call baseline, not left stale — the rename makes the
  mapped candidate match the real call.
- No test name is added, removed or reworded.
