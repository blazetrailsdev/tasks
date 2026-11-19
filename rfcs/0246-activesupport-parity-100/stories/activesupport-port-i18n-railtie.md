---
title: "activesupport-port-i18n-railtie"
status: draft
updated: 2026-11-19
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

# activesupport: port I18n::Railtie (i18n_railtie.rb)

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb` (140 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-i18n-railtie`.

## Acceptance criteria

- [ ] Port `i18n_railtie.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Cover the port with the Rails tests that exercise it.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
