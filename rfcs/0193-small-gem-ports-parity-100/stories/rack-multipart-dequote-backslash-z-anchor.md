---
title: "rack: Parser#dequote spells Ruby's \\Z anchor"
status: in-progress
updated: 2026-10-23
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#9275
claim: "2026-10-23T16:19:36Z"
assignee: "blocklocator-locate-many-filters-nils"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Multipart::Parser#dequote` (`vendor/rack/v3.1.14/lib/rack/multipart/parser.rb:253`) matches `/\A"(.*)"\Z/`. Ruby's `\Z` also matches just before a trailing `\n`. `packages/rack/src/multipart/parser.ts#dequote` uses `/^"([^\n]*)"$/` (no `m` flag), whose `$` matches only at the very end, so a value ending `"…"\n` keeps its quotes where Rack strips them.

## Acceptance criteria

- [ ] The regex is spelled `/^"([^\n]*)"(?=\n?$)/`, the JS form of `\A…\Z`.
- [ ] A test proves a quoted value with a trailing `\n` dequotes as in Rack.
