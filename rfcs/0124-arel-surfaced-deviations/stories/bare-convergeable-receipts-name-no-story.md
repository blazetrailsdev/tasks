---
title: "bare-convergeable-receipts-name-no-story"
status: in-progress
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7163
claim: "2026-08-28T14:24:28Z"
assignee: "dot-visit-edge-error-drops-the-class-namespace"
blocked-by: null
closed-reason: null
---

## Context

`no-freeform-comments` now keeps the story id after `CONVERGEABLE` (PR #7155,
`eslint/no-freeform-comments.mjs`), and the seven receipts whose id PR #7132
(`9415a63a9`) stripped were restored there:
`abstract-adapter.ts` (4 × `abstract-adapter-constructor-drops-rails-config-arg`),
`relation/delegation.ts` (2 × `delegation-relation-delegate-cache-builds-lazily`),
`relation/calculations.ts` (`port-load-async-future-result-for-select-async-arm`).

That leaves the rest: `git grep -c 'CONVERGEABLE$' -- '*.ts'` reports ~103 bare
`CONVERGEABLE` receipts. None of them lost a story id in the sweep — checking
`9415a63a9~1` shows each carried an English reason naming no story (e.g.
`@noRailsEquivalent CONVERGEABLE the accumulation body of
CollectionAssociation#concat_records, extracted rather than inlined
(collection_association.rb:438-454)`). `classifyReason` reads only the leading
token, so all of them are green on every gate today while pointing at nothing.

Per the two-shape rule in CLAUDE.md, a bare `CONVERGEABLE` is half a receipt:
the story IS the reason, so a tag with no story id has no reason at all.

## Acceptance criteria

- Every `CONVERGEABLE` tag in `packages/**/src/**/*.ts` either names an existing
  story id or is flipped to `PERMANENT`. The pre-sweep reason at
  `9415a63a9~1` is the evidence for which — a reason describing a genuine
  TypeScript shortcoming is `PERMANENT`; one describing an unfinished port gets
  a story (an existing one where it fits, a new one where it does not).
- A follow-up gate (or an extension of `lint-missing-rails-call-reasons`)
  rejects a bare `CONVERGEABLE`, so the shape cannot regress.
- Split across as many PRs as the LOC ceiling needs — one package per PR is the
  natural cut.
- `pnpm parity:api:extra`, `parity:api:calls`, `parity:api:calls:args` green;
  no baseline row added.
