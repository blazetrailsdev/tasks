---
title: "activesupport-port-kernel-singleton-class"
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

# activesupport: port Kernel#class_eval (core_ext/kernel/singleton_class.rb)

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/kernel/singleton_class.rb` (8 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-kernel-singleton-class`.

## Acceptance criteria

- [ ] Port `core_ext/kernel/singleton_class.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Cover the port with the Rails tests that exercise it.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
