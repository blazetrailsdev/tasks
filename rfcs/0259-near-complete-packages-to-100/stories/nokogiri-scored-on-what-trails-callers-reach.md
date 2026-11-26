---
title: "nokogiri: score only the surface trails' callers reach"
status: claimed
rfc: "0259-near-complete-packages-to-100"
cluster: scoping
packages: [nokogiri, scripts]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-11-26T14:14:48Z"
assignee: "generator-class-paths-actiontext-actionmailbox-stimulus"
blocked-by: null
closed-reason: null
updated: 2026-11-26
---

## Context

nokogiri is scored against the whole gem: API 248 / 601, tests 96 / 351 on
trailmap (2026-11-24). trails reaches only part of it, through
rails-dom-testing, rails-html-sanitizer (and loofah), actionview's sanitize
and test helpers, actiontext, and ActiveSupport's `XmlMini_Nokogiri`
(`vendor/rails/v8.0.5.2/activesupport/lib/active_support/xml_mini/nokogiri.rb`).

`scripts/parity/unported-files/pg.ts` is the model. Its denominator is "what
activerecord calls" (RFC 0186 § "Scoring"), and a file no caller reaches gets a
`NOT_CALLED` row.

Build the call set from the **Ruby** callers, not from the TS port, so an
unported caller still pulls its callee into scope. nokogiri's Ruby layer
wraps a C extension, so a reached Ruby method keeps its C-backed callees in
scope through the TS port.

## Acceptance criteria

- [ ] `scripts/parity/unported-files/nokogiri.ts` lists every gem file no
      caller reaches, with a single "not called by trails" reason.
- [ ] Partly reached files carry `SCOPED_SKIP_GROUPS` rows for the members
      nothing calls.
- [ ] The PR body records the expected API and test denominators the call set
      implies, and `pnpm parity:api` / `pnpm parity:test` report exactly those
      totals after the change.
- [ ] The PR body tables the caller → gem-member set, with Ruby `file:line`.
- [ ] Gem tests that exercise only out-of-scope files leave the test
      denominator through the same rows.

## Verification

```sh
pnpm parity:api --package nokogiri && pnpm parity:test -- --package nokogiri
```
