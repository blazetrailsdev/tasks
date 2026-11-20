---
title: "activesupport-port-core-ext-regexp"
status: in-progress
updated: 2026-11-20
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10445
claim: "2026-11-20T20:58:47Z"
assignee: "activesupport-api-deprecation-modules-weakset-hashbuilder-supers"
blocked-by: null
closed-reason: null
---

# activesupport: port Regexp#multiline? (core_ext/regexp.rb)

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/regexp.rb` (14 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-core-ext-regexp`.

## Acceptance criteria

- [ ] Port `core_ext/regexp.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Cover the port with the Rails tests that exercise it.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
