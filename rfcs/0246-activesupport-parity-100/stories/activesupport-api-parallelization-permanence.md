---
title: "activesupport: rule testing/parallelization permanent or port it"
status: ready
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: receipts
packages: [activesupport]
deps: [active-support-test-parallelization-threshold-unseated]
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

`testing/parallelization.rb` (`start`), `parallelization/server.rb`
(`name`, `name=`) and `parallelization/worker.rb` (`start`) are ✗ in
`parity:api`. Rails forks worker processes and talks to them over DRb.
`testing/parallelize_executor.rb` already has an `unported-files` row.

## Acceptance criteria

- [ ] If the operator rules RFC 0246 Open question 2 "permanent": add
      `PERMANENT:` unported-files rows for the three files that cite § "Runtime
      facts Node does not expose" (the `fork` bullet), and reword the
      `parallelize_executor.rb` row the same way.
- [ ] If the ruling is "port": port the four members onto vitest workers.
- [ ] No ✗ parallelization file is left.
