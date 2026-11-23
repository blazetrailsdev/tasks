---
title: "Port racc v1.8.1's four new test_racc_command tests"
status: ready
updated: 2026-11-23
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The racc pin moved v1.8.0 → v1.8.1 in the dependent-source bump bundle (RFC 0191 § 1). The lib
change is version-only, so the PR shipped the flip alone. The dry run
(`scripts/parity/bump-ledger/reports/racc-v1.8.0-v1.8.1.2026-11-22.json`) counts tests 63 → 67 (+4):
`vendor/racc/v1.8.1/test/test_racc_command.rb` gains +24 lines with the new `test/regress/optional`
grammar fixtures (`git diff --no-index --stat vendor/racc/v1.8.0/test vendor/racc/v1.8.1/test`).

## Acceptance criteria

- [ ] The 4 new `test_racc_command.rb` tests are ported with their fixtures, names verbatim.
- [ ] `pnpm parity:test --package racc` delta non-negative.
