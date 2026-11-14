---
title: "InvalidCountryCode extends StandardError, as country.rb:7 does"
status: draft
updated: 2026-11-14
rfc: "0231-tzinfo-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/tzinfo/v2.0.6/lib/tzinfo/country.rb:7` declares `class InvalidCountryCode < StandardError`.
`packages/tzinfo/lib/country.ts:1-3` has `InvalidCountryCode extends Error` with an
`override name` field. Its sibling errors in `data-source.ts:14-16` (`InvalidDataSource`,
`DataSourceNotFound`) already extend ruby-compat's `StandardError`.

## Acceptance criteria

- [ ] `InvalidCountryCode extends StandardError` (from `@blazetrails/ruby-compat`), with no `name` override.
- [ ] `rescue StandardError` reaches it: `instanceof StandardError` is true.
