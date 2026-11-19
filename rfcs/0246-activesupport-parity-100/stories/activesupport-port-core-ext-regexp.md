---
title: "activesupport-port-core-ext-regexp"
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
