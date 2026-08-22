---
title: "A comma-separated @missingRailsCall tag parses as nothing at all"
status: claimed
updated: 2026-08-22
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-22T01:20:38Z"
assignee: "lint-red-on-main-unnecessary-type-assertion-pg-exec-query"
blocked-by: null
closed-reason: null
---

# A comma-separated `@missingRailsCall` tag parses as nothing at all

## Context

`tagLine` in `scripts/api-compare/missing-rails-call-tags.ts` is
`^\s*\*?\s*@missingRailsCall\s+(\S+)(?:\s+—\s?(.*))?$` — one call token, then
the em-dash. A tag naming two calls therefore matches nothing: the parser sees
prose, so the tag suppresses no flag, raises no empty-reason error, and is
invisible to the permanence gate `require-permanence-claim-on-missing-rails-call`
(PR #6840) added. It is the same quiet-direction hazard RFC 0083 closed for the
one-line form.

Two such tags are in the tree, both silent no-ops today:

- `packages/trailties/src/application.ts:158` —
  `@missingRailsCall build_middleware, merge_into` (railties/lib/rails/application.rb:159-165).
- `packages/trailties/src/application/finisher.ts:148` —
  `@missingRailsCall reloaders, to_run`
  (railties/lib/rails/application/finisher.rb:150-156).

PR #6840 converged the third instance by hand —
`packages/trailties/src/minitest/rails-plugin.ts` now carries one tag per call
(`reject!`, `<<`) — but left these two, since they were outside its stories.

## Converged shape

One tag per call, as the parser and the receipt report already assume, plus a
parser-level guard so the shape cannot regress silently: a line that starts with
the tag and does not match `tagLine` should raise the way a call-less tag does
("needs a call"), rather than being read as prose. `parseJsdoc` already has that
error and the exact reporting seam (`callLessTagLine` / `at(sourceIndex)`).

## Acceptance criteria

- [ ] A comma-separated `@missingRailsCall` tag is a hard error naming its
      `file:line`, not silently-ignored prose.
- [ ] `application.ts` and `finisher.ts` carry one classified tag per call.
- [ ] `parity:api:calls` and `parity:api:calls:report` stay green, with the
      receipts each tag now really makes accounted for.
