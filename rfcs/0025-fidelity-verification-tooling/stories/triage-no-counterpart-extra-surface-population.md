---
title: "Triage the 464 novel extras newly measured on files with no Rails counterpart"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5427 (`extra-surface-skips-files-without-rails-counterpart`) closed a
measurement hole: TS files with no Rails counterpart were skipped entirely by
`api:extra`, so their whole public surface was invisible. They are now scored
with an empty allowed set and broken out in the `NoCntrp` column.

That newly surfaced **186 files / 1119 extras / 464 novel** which nobody has
ever looked at. Per-package `NoCntrp` totals as of the merge:
activesupport 407, activerecord 346, actiondispatch 103, trailties 99, arel 65,
actionview 38, activemodel 32, globalid 17, rack 6, actioncontroller 5,
actionpackversion 1.

Highest-novel files: `activesupport/fs-adapter.ts` (37 novel),
`activesupport/crypto-adapter.ts` (16), `activemodel/index.ts` (13),
`activesupport/process-adapter.ts` (12),
`activerecord/connection-adapters/abstract/sql-datetime.ts` (11),
`actiondispatch/request-forgery-protection.ts` (10),
`activerecord/connection-adapters/abstract/temporal-wire.ts` (9),
`activesupport/range-ext.ts` (9). `activerecord/ar-config.ts` (18 novel) is
already owned by RFC 0081 and is out of scope here.

This population is not uniform. Some of it is genuinely unportable host-adapter
surface (`fs-adapter`, `crypto-adapter`, `process-adapter` stand in for Ruby
stdlib with no Rails file), which RFC 0080's `@noRailsEquivalent` tag exists to
record on the declaration. Some is unconverged trails invention that should be
deleted or converged. Nothing should be tagged just to zero the column — the
tag is a documented justification, not a mute button.

This is a triage story: classify, then file the convergence work as its own
stories. Do not attempt the convergence here.

## Acceptance criteria

- Walk the `rubyFile === null` files in `pnpm api:extra --json`, ordered by
  novel count, and classify each into: (a) permanently unportable — tag with
  `@noRailsEquivalent <reason>` at the declaration, citing what Ruby/Rails
  provides instead; (b) unconverged trails surface — leave untagged so it keeps
  flagging, and file a convergence story per cluster; (c) a tooling gap where
  Rails DOES have the method and the file map or candidate naming is wrong —
  fix the mapping, never the tag.
- Land only the (a) tags and the (c) mapping fixes in this story's PR; register
  (b) as new stories under the appropriate RFC with the trails/Rails file:line
  already captured.
- Report the `NoCntrp` delta per package before/after, and state how much of the
  remainder is (b) awaiting its own stories.
