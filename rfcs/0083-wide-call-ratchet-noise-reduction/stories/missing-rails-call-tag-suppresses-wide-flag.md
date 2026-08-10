---
title: "Make @missingRailsCall load-bearing so permanent deviations leave the baseline"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: ["ruby-extractor-record-call-receiver-kind"]
deps-rfc: []
est-loc: 320
priority: 10
pr: 5754
claim: "2026-07-31T20:45:00Z"
assignee: "missing-rails-call-tag-suppresses-wide-flag"
blocked-by: null
closed-reason: null
---

## Context

`parity:api:build` (`scripts/api-compare/build.ts`) already reconciles
`@missingRailsCall <ruby_call> — <reason>` JSDoc tags against the wide artifact,
migrating reasons out of the baselines and enforcing the empty-reason contract
(`lint-missing-rails-call-reasons.ts`, RFC 0080 story
`missing-rails-call-empty-reason-contract`). But **nothing in `compare.ts` or
`lint-call-mismatches-wide.ts` reads the tag** — annotating a call does not
remove its baseline entry, so the tag is documentation only.

That is the blocker on the list ever reaching zero. Some entries are permanent
and correct: ~30 `synchronize` rows (Ruby guards with `Mutex#synchronize`;
trails is single-threaded) and the 349 entries already carrying real per-entry
verification reasons. They will never converge and should not sit in a
JSON baseline forever.

Direct precedent: RFC 0080's `retire-extra-surface-allow.json — tags are the
single source of truth`, which did exactly this for the extra-surface allowlist.
Also matches the standing preference for justifying deviations at the call site
rather than in a PR body or a JSON blob.

Sequenced LAST in the RFC so tags are only minted against a de-noised
population.

## Acceptance criteria

- `checkCalls` suppresses a mismatch when the matched TS method carries a
  `@missingRailsCall <ruby_call>` tag with a non-empty reason.
- Suppression is keyed to the specific `(tsFile, tsName, ruby_call)` triple — a
  tag for one call must not silence another.
- The empty-reason contract is reused, not reimplemented: a bare or
  whitespace-only tag still fails, per `lint-missing-rails-call-reasons.ts`.
- A tag that no longer corresponds to a flagged call is reported as stale, the
  same only-shrink discipline the baseline dir has today
  (`lint-call-mismatches-wide.ts:270-281`).
- `parity:api:build` migrates a reasoned baseline entry to a tag and drops it from the
  split baseline dir in one operation.
- Beware `project_bare_jsdoc_tag_in_reason_prose_drops_surface`: a line-leading
  prose `@tag` inside a reason has bitten this tag family before (RFC 0080
  stories). Cover it with a test.
- Depends on: ruby-extractor-record-call-receiver-kind.

## Size waiver (PR #5754)

The implementing PR is 790+/132- against the 500-LOC ceiling, requested
explicitly rather than by oversight. ~105 additions and ~100 deletions are the
verbatim move of `parseJsdoc` / `TAG` / `DEFAULT_REASON` out of `build.ts` into
the new shared `missing-rails-call-tags.ts`, and ~430 of the remainder is tests
across five files. The production change is ~250 LOC and is not separable: the
extractor field, the `checkCalls` suppression, the stale-tag gate and the
`parity:api:build` round-trip are one contract — ship any subset and either the tag
stays inert or `parity:api:build` drops baseline rows nothing honours, i.e. `main`
carries a half-wired gate between PRs.
