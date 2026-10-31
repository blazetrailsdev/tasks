---
title: "Vendor Zeitwerk v2.7.2 and record the two reversals"
status: in-progress
updated: 2026-10-31
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-gem
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9518
claim: "2026-10-30T23:40:52Z"
assignee: "constantize-restored-over-namespaces"
blocked-by: null
closed-reason: null
---

## Context

Rails 8.0.2 locks Zeitwerk at 2.7.2 (`vendor/rails/v8.0.2/Gemfile.lock:676`), inside railties' `~> 2.6` (`vendor/rails/v8.0.2/railties/railties.gemspec:46`). RFC 0213 § "Vendoring and version". Tag `v2.7.2`, commit `6aa28216c8dbea60bea097d7c7e6f4cc5210a080`.

## Acceptance criteria

- `vendor/sources.ts` and `vendor/sources.lock.json` carry `zeitwerk` with `libPath: "lib/zeitwerk"`, `libEntryFile: "lib/zeitwerk.rb"`, `testPath: "test"`.
- `vendor/README.md` lists the source.
- `docs/claude-md-decision-history.md` records both reversals with dates and reasons.
