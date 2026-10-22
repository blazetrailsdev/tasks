---
title: "rack spec_deflater.rb takes the Rails spec bodies"
status: claimed
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-10-22T16:52:16Z"
assignee: "base-constructor-assigns-associations-through-writer"
blocked-by: null
closed-reason: null
---

## Context

Split from `rack-remaining-specs-take-rails-bodies`. This story owned four specs. On 2026-10-22
`spec_files.rb`, `spec_static.rb` and `spec_builder.rb` moved to
`rack-files-spec-takes-rails-bodies`, `rack-static-spec-takes-rails-bodies` and
`rack-builder-spec-takes-rails-bodies`, and this story keeps `spec_deflater.rb`.

Measured on trails `a0874e9576` with a fresh build, `pnpm parity:test --package rack --assertions`:
`packages/rack/src/deflater.test.ts` vs `vendor/rack/v3.1.14/test/spec_deflater.rb` has
27 count and 27 kind mismatches.

## Acceptance criteria

- [ ] `deflater.test.ts` takes the Rails spec bodies verbatim (same apps, same assertion kinds
      and literal values), with test names unchanged.
- [ ] 0 assertion-count, kind and value mismatches for `spec_deflater.rb`.
