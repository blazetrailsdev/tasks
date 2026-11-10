---
title: "Port builder's second \"use entities if \u2026kcode\u2026\" pair in test_markupbuilder.rb"
status: draft
updated: 2026-11-09
rfc: "0000-small-gem-tail-parity"
cluster: null
packages:
  - "builder"
deps: []
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

`pnpm parity:test` builder 96/98: `vendor/builder/v3.3.0/test/test_markupbuilder.rb`
defines "use entities if no encoding is given and kcode is none" and "use
entities if encoding is utf but kcode is not" twice each, in two test classes;
`packages/builder/test/markupbuilder.test.ts` ports one of each.

## Acceptance criteria

- [ ] The second copy of each is ported under the describe matching its Ruby class.
- [ ] `pnpm parity:test --package builder` reports 98/98.
