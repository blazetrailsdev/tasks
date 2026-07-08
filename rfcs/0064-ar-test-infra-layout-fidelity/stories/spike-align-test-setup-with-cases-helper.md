---
title: "Spike: align AR test-setup layout with Rails test/cases/helper"
status: draft
updated: 2026-07-08
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4791 (RFC 0055 serialization-fidelity) added a suite-wide encryption **config**
bootstrap to `packages/activerecord/src/test-setup-ar.ts`, mirroring Rails'
`activerecord/test/cases/helper.rb:98-102`. That file already mirrors helper.rb
line-by-line elsewhere:

- `test-setup-ar.ts` → helper.rb `:29` (delegate-base ban), `:40` (invert plural
  associations), `:42` (raise-on-assign-to-readonly), `:98-102` (encryption config).

But `helper.rb`'s responsibilities are **split across several trails files** —
`test-setup-worker-db.ts`, `test-setup-ar.ts`, `test-adapter.ts`,
`test-helpers/canonical-schema.ts`, and the vitest `globalSetup`
(`test-helpers/template-global-setup.ts`). So `test-setup-ar.ts` is only a _partial_
helper.rb mirror; a naive rename to `cases/helper.ts` would over-claim.

Question raised while reviewing #4791: should we rename/reorganize these under a Rails
`test/cases/`-style layout (e.g. a `cases/helper.ts`), or keep the `test-setup-*`
convention?

## Acceptance criteria (spike — audit + recommendation, no code change)

- Inventory what Rails `activerecord/test/cases/helper.rb` does and map each
  responsibility to its current trails file/location.
- Weigh the trade-offs explicitly: vitest `setupFiles` auto-run vs Rails `require`;
  the `test-setup-*` sibling naming consistency; the partial-mirror over-claim risk;
  whether `test:compare` / `api:compare` gain anything (they map test cases/source, not
  setup infra); cost of updating `vitest.config.ts` path references.
- Produce a short recommendation (audit-report): either
  (a) a concrete consolidation/rename plan under a `cases/` tree, broken into follow-up
  stories, or
  (b) a documented "keep as-is" rationale (so it is not re-litigated), noting the
  line-by-line comment annotations already provide the discoverability benefit.
- The spike is done when the recommendation is written and the RFC is either fleshed out
  with follow-up stories or closed with the rationale.
