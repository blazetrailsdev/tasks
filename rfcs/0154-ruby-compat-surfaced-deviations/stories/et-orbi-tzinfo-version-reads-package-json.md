---
title: "et-orbi-tzinfo-version-reads-package-json"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
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

`packages/et-orbi/lib/info.ts` `tzinfoVersion` / `tzinfoDataVersion` mirror
`vendor/et-orbi/v1.2.11/lib/et-orbi/info.rb:59-71`, which read
`Gem.loaded_specs['tzinfo']` / `['tzinfo-data']`. RubyGems is not ported
(CLAUDE.md "RubyGems is not ported"), and `Gem.loadedSpecs` is always empty
(`packages/ruby-compat/lib/gem.ts`), so `tziv` always renders the error
inspect and `tzidv` always `nil`.

## Acceptance criteria

- `tzinfoVersion` answers the `version` of `@blazetrails/tzinfo`'s package.json.
- `tzinfoDataVersion` keeps the rescue-nil arm; with no tzinfo-data package it answers `null`.
- Neither reads `Gem.loadedSpecs`; a test in `packages/et-orbi/test` asserts the strings.
