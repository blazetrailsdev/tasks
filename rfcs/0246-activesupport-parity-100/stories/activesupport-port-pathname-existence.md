---
title: "activesupport-port-pathname-existence"
status: claimed
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-20T20:58:47Z"
assignee: "activesupport-api-deprecation-modules-weakset-hashbuilder-supers"
blocked-by: null
closed-reason: null
---

# activesupport: port Pathname#existence (core_ext/pathname/existence.rb)

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/pathname/existence.rb` (23 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api` and `core_ext/pathname/existence_test.rb` from `parity:test`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-pathname-existence`.

## Acceptance criteria

- [ ] Port `core_ext/pathname/existence.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Port `core_ext/pathname/existence_test.rb` under the Rails test names.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
