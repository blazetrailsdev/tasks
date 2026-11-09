---
title: "Thor parity:api: CapturableERB superclass reads ERB, not TSE"
status: ready
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found at the 2026-11-09 refine. `parity:api --package thor` inheritance reads 21/22: `Thor::Actions::CapturableERB`
(`vendor/thor/v1.3.2/lib/thor/actions/file_manipulation.rb`) is `< ERB`, while
`packages/thor/lib/actions/file-manipulation.ts:324` is `extends TSE` (super-mismatch).

## Acceptance criteria

- [ ] Either CapturableERB extends the repo's ERB port (if one exists), or the ERB→TSE mapping is recorded
      as a sanctioned superclass alias in the api-compare config with a reason, so the row is not a miss.
- [ ] `parity:api --package thor` inheritance reads 22/22.
