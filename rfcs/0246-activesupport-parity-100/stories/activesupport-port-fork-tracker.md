---
title: "activesupport-port-fork-tracker"
status: ready
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
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

# activesupport: port ActiveSupport::ForkTracker

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/fork_tracker.rb` (43 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api` and `fork_tracker_test.rb` from `parity:test`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-fork-tracker`.

## Acceptance criteria

- [ ] Port `fork_tracker.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Port `fork_tracker_test.rb` under the Rails test names.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
