---
title: "Decide the empty-reason contract for hand-authored @missingRailsCall tags"
status: done
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5460
claim: "2026-07-27T21:34:17Z"
assignee: "missing-rails-call-empty-reason-contract"
blocked-by: null
closed-reason: null
---

## Context

The two api-compare JSDoc tags disagree on whether an unjustified tag is an
error, and PR #5412 documented the asymmetry rather than resolving it (a
change to `@missingRailsCall` was an explicit RFC 0080 non-goal for that
docs-scoped story):

- `@noRailsEquivalent` — an empty reason is a hard extraction-time error
  (`scripts/api-compare/extract-ts-api.ts:1356`). Rationale: the tag is the
  only thing standing between a name and the extra-surface count, so an
  unjustified one suppresses drift with no argument for it.
- `@missingRailsCall` — a bare tag parses as `reason: ""`
  (`scripts/api-compare/build.ts:97`, regex `TAG_LINE` at `build.ts:78`) and
  reconcile later fills the reason from the curated baseline row or a
  placeholder. An empty reason is an input state, not an error.

The `build.ts` behavior is deliberate for the _generated_ path (stubs and
newly-discovered missing calls are emitted with a placeholder reason). What is
unexamined is the _hand-written_ path: a human writing a bare
`@missingRailsCall foo` with no justification gets silently backfilled with a
placeholder, which is exactly the "allowlist entry with no argument" failure
mode the sibling tag rejects. See the "Sibling tag: `@noRailsEquivalent`"
section of `docs/infrastructure/api-build-stub-generation-plan.md` (the
"deliberately not shared" list) for the documented contrast.

## Acceptance criteria

- Decide and document whether a hand-authored bare `@missingRailsCall` should
  error, distinguishing it from the generator-authored placeholder path (the
  literal `unported (api:build stub)` / wide `DEFAULT_REASON` strings are
  already distinguishable).
- If it should error: reject it in `parseJsdoc`/reconcile with a `file:line`
  message matching `noRailsEquivalentReason`'s shape, and keep the
  generator's placeholder path working (round-trip idempotency and
  `rawLines` fidelity must not regress).
- If it should not: record the reason in the design doc's "deliberately not
  shared" list so the asymmetry stops reading as an oversight.
- Either way the two tags' empty-reason contracts are stated in one place.
