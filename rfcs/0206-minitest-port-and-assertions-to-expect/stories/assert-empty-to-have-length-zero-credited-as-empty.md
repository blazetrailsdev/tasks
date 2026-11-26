---
title: "Credit toHaveLength(0) as assert_empty, or fix the CONTRIBUTING row"
status: draft
updated: 2026-11-26
rfc: "0206-minitest-port-and-assertions-to-expect"
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

## Context

CONTRIBUTING.md § "Porting a Minitest assertion" maps `assert_empty o`
(`minitest/assertions.rb:188`) to the built-in `expect(o).toHaveLength(0)`.
`scripts/test-compare/assertion-kinds.ts` scores `assert_empty` (`:97`) and
`toBeEmpty` (`:292`) as `"empty"` but `toHaveLength` (`:296`) as `"length"`, so a
port that follows the table reds the assertion-mismatch ratchet (trails#10813,
run 45880625197: `loofah assertion-kind-mismatch +48`).

## Acceptance criteria

- [ ] `assertion-kinds.ts` credits `toHaveLength(0)` as `"empty"` (a literal
      `0` argument only), or the CONTRIBUTING row is changed to `toBeEmpty()`.
- [ ] The two agree, with a test in `scripts/test-compare/` pinning it.
