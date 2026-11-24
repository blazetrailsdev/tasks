---
title: "libxml-ruby: score only what XmlMini reaches"
status: ready
rfc: "0259-near-complete-packages-to-100"
cluster: scoping
packages: [libxml-ruby, scripts]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
updated: 2026-11-24
---

## Context

libxml-ruby is scored against the whole gem: API 28 / 127, tests 7 / 390 on
trailmap (2026-11-24). Its only Rails caller is
`vendor/rails/v8.0.5.2/activesupport/lib/active_support/xml_mini/libxml.rb`
(and `libxmlsax.rb` if ported).

Scope it as pg is scoped (`scripts/parity/unported-files/pg.ts`, RFC 0186
§ "Scoring"): build the call set from those Ruby callers, and give every gem
file outside it a "not called by activesupport" row. The package has no open
stories today.

## Acceptance criteria

- [ ] `scripts/parity/unported-files/libxml-ruby.ts` removes every gem file
      outside the XmlMini call set.
- [ ] The PR body records the expected API and test denominators the call set
      implies, and `pnpm parity:api` / `pnpm parity:test` report exactly those
      totals after the change.
- [ ] The PR body tables that set with Ruby `file:line`.
- [ ] Out-of-scope gem tests leave the test denominator.

## Verification

```sh
pnpm parity:api --package libxml-ruby && pnpm parity:test -- --package libxml-ruby
```
