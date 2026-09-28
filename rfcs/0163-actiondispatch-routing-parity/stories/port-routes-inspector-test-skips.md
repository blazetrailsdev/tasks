---
title: "Port routing/inspector_test.rb's 16 skipped tests"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["mapping-make-route-source-location", "routing-invented-surface-and-generate-prefix-arity"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/routing/inspector_test.rb` is one
class, `RoutesInspectorTest` (`:23-480`), with 31 tests. trails matches all 31
by name in `dispatch/routing/inspector.test.ts`, and 16 are empty skip stubs
(9 in Rails lines 23-249, 7 in 250-480), among engines, mounted Rack apps,
assets-prefix exclusion, filtering, and the expanded formatter — whose
"Source Location" row needs `Mapper.route_source_locations`
(`mapping-make-route-source-location`, RFC 0141).

## Acceptance criteria

- The 16 stubs are real tests with Rails' bodies.
- The file reports 31/31 with 0 skipped.
