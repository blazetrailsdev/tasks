---
title: "ThroughAssociation#source_reflection is defined, not only declared"
status: ready
updated: 2026-11-11
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the 8.0.2 entry check (`entry-check-data-layer-parity-is-closed-on-8-0-2`,
trails `876804dd8b`): `parity:api` reports
`ActiveRecord::Associations::ThroughAssociation#source_reflection` missing
from `associations/through-association.ts` (10/11, 1 declaration-only).

Rails: `delegate :source_reflection, to: :reflection`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/through_association.rb:7`).
trails declares it bodyless in the host interface
(`packages/activerecord/src/associations/through-association.ts:29`,
`sourceReflection(): any;`) and calls it at `:86` and `:98`, so no
definition in the Rails file answers the name.

## Acceptance criteria

- [ ] `sourceReflection` is defined in `through-association.ts` as the
      Rails delegation to `reflection` (the settled `delegate` idiom), not
      only declared.
- [ ] `API_COMPARE_FORCE=1 pnpm parity:api` shows
      `associations/through_association.rb` at 11/11.
