---
title: "activesupport: close test_case.rb and testing/time_helpers.rb API gaps"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:api` shows `test_case.rb` at 34/48 (14 missing) and
`testing/time_helpers.rb` at 15/21 (6 missing). Several RFC 0158 test-case
stories touch the same files. Check for overlap before you start.

## Acceptance criteria

- [ ] Port each missing member, or receipt it under a ratified section.
- [ ] Both files reach 100% in `parity:api`.
