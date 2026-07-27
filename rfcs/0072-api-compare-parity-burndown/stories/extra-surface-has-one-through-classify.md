---
title: "extra-surface: classify has-one-through-association.ts's 5 novel extras"
status: draft
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `extra-surface-relocate-load-through` (PR #5364).
`packages/activerecord/src/associations/has-one-through-association.ts` still
reports **5 novel extras** under
`pnpm api:compare && pnpm api:extra --package activerecord --novel-only`:

```text
detachDisplacedRecord  detachDisplacedTarget  loadTargetForBuild
persistReplace         persistThroughRecord
```

Rails' `has_one_through_association.rb` declares only `replace` and
`create_through_record` (plus what it inherits from `HasOneAssociation` /
`ThroughAssociation`) — see
`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb`.
The five names above are trails inventions supporting the has_one_through
replace/persist queue (the deferral marker documented at the top of the TS
class), not ports of anything Rails declares in that file.

The parent classification story `extra-surface-associations-engine-classify`
covered `associations.ts`'s novel extras only; this file was never triaged.
`associations/has-one-association.ts` reports the same 5-extra shape
(`detachDisplacedRecord`, `detachDisplacedTarget`, `loadTargetForBuild`,
`needsTargetLoadForBuild`, `syncWrite`) and is likely the same cluster, so
scope both together if they turn out to share a root.

## Acceptance criteria

- Each of the five names is classified as (a) invention to delete, (b) faithful
  internal warranting an `@internal` tag justified at the declaration site, or
  (c) misplaced port to relocate + rename onto its Rails name and Rails-layout
  file.
- Category (a) and (c) names are actioned in this story; category (b) names
  carry a declaration-site justification, not a bare allowlist entry (see the
  RFC 0072 fidelity-first policy).
- `pnpm api:extra --package activerecord --novel-only` shows
  `associations/has-one-through-association.ts` dropping by the number of names
  actioned; record before/after in the PR body.
- has_one_through association tests pass with no test renames.
