---
title: "activesupport-port-evented-file-update-checker"
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
claim: "2026-11-20T22:47:06Z"
assignee: "activesupport-api-misses-remainder-after-bundle"
blocked-by: null
closed-reason: null
---

# activesupport: port EventedFileUpdateChecker

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/evented_file_update_checker.rb` (181 lines) has no trails
counterpart. Its row in `scripts/parity/unported-files/activesupport.ts` (and
`baseline.json`) hides it from `parity:api` and `evented_file_update_checker_test.rb` from `parity:test`. The
`activesupport-unported-files-permanence-audit` story found no ratified limit
for it, so the row reads `CONVERGEABLE activesupport-port-evented-file-update-checker`.

## Acceptance criteria

- [ ] Port `evented_file_update_checker.rb` to `packages/activesupport/lib/` at the Rails path and names.
- [ ] Port `evented_file_update_checker_test.rb` under the Rails test names.
- [ ] Delete the row from `unported-files/activesupport.ts` and `baseline.json`.
