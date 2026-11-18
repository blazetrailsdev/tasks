---
title: "activesupport: rule testing/parallelization permanent or port it"
status: draft
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: [activesupport-parity-baseline-remeasure]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`testing/parallelization.rb`, `parallelization/server.rb` and
`parallelization/worker.rb` are ✗ in `parity:api` (4 members).
`testing/parallelize_executor.rb` is already in `unported-files`.

## Acceptance criteria

- [ ] Follow the ruling on RFC 0246 Open question 2. Add `PERMANENT:`
      unported-files rows that cite the section, or port the members onto
      vitest workers.
- [ ] No ✗ parallelization file is left.
