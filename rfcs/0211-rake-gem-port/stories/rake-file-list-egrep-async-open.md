---
title: "rake-file-list-egrep-async-open"
status: ready
updated: 2026-10-31
rfc: "0211-rake-gem-port"
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

`FileList#egrep` (`packages/rake/src/file-list.ts`) reads through `File.readAsync`, where `vendor/rake/v13.2.1/lib/rake/file_list.rb:293-316` calls `File.open(fn, "r", *options)` and `inf.each`. ruby-compat's `File.open` is sync, so `*options` has no async carrier.

## Acceptance criteria

- [ ] `egrep` opens each file through an async `File.open` with `*options`, reads by line, and takes a String `pattern`; its `@missingRailsArgs open` tag is removed.
