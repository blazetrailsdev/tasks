---
title: "gem_version returns a String instead of Gem::Version"
status: draft
updated: 2026-09-22
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord.gem_version` returns `Gem::Version.new(VERSION::STRING)`
(`vendor/rails/activerecord/lib/active_record/gem_version.rb:5-7`); the same holds for
activesupport, activemodel and actionpack. trails' `gemVersion()` in each package's
`gem-version.ts` returns the bare String, because RubyGems' `Gem::Version` has no port
(ruby-compat has none; `abstract-adapter.ts`'s `Version` is the adapter's database version).
Callers comparing versions (`deprecator.ts`) therefore compare strings.

## Acceptance criteria

- Port `Gem::Version` (RubyGems `lib/rubygems/version.rb`) into ruby-compat, at least
  `new`, `<=>`, `to_s`, `segments`.
- Every `gemVersion()` returns `new GemVersion(VERSION.STRING)`; the
  `@missingRailsCall new — CONVERGEABLE` receipts are removed.
