---
title: "et-orbi: credit the seven iso8601 loop tests"
status: ready
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: small-packages
packages: [et-orbi, scripts]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Seven et-orbi tests run but are not credited: their titles are built with
`rbInspect(i)` inside a loop, and test-compare's TS extractor cannot evaluate
the call, so the Ruby `#{i.inspect}` titles go unmatched.

## Acceptance criteria

- [ ] Either the titles are written as literals the extractor reads, or the extractor learns `rbInspect` over a literal loop array.
- [ ] `parity:test` credits all 7; no test name changes.

## Verification

```sh
pnpm parity:test --missing --package et-orbi  # 0 rows
```
