---
title: "activesupport: close subscriber.rb and output_safety.rb API gaps"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`subscriber.rb` is at 11/18 and `core_ext/string/output_safety.rb` is at
18/25 in `parity:api`.

## Acceptance criteria

- [ ] Port the 14 missing members, or receipt them.
- [ ] Both files reach 100%.
