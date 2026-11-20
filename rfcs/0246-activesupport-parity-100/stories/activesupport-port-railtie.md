---
title: "activesupport-port-railtie"
status: closed
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
closed-reason: "Duplicate/misplaced: ActiveSupport::Railtie is ported in trailties (packages/trailties/lib/trailties/active-support.ts on origin/main 6267d89132 has 7 initializers), not packages/activesupport/lib. Remaining initializers are owned by 0101 activesupport-railtie-missing-thirteen-initializers; the unported-files row is owned by 0158 parity-maps-framework-railtie-to-trailties."
---

# activesupport: port ActiveSupport::Railtie (railtie.rb)

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/railtie.rb` (163 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-railtie`.

## Acceptance criteria

- [ ] Port `railtie.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Cover the port with the Rails tests that exercise it.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
