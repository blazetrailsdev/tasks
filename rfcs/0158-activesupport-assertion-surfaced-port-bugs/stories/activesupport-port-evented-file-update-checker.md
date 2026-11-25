---
title: "activesupport-port-evented-file-update-checker"
status: in-progress
updated: 2026-11-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps:
  - port-listen-gem-for-evented-file-update-checker
deps-rfc: []
est-loc: null
priority: null
pr: trails#10735
claim: "2026-11-25T12:29:39Z"
assignee: "activesupport-port-evented-file-update-checker"
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
