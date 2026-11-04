---
title: "trails-tsc: key modelRegistry by class identity, not bare name"
status: draft
updated: 2026-11-04
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`collectBaseDescendants` (packages/activerecord-cli/src/type-virtualization/transitive-extends-walker.ts) still builds `modelRegistry` as bare class name → file. When two models share a name, the shortest path wins, and `resolveAutoImports` (tsc-wrapper/ar-models-plugin.ts) can import the wrong one. trails#9699 moved schema-scope ancestors to `classKey(file, name)` but left the registry alone. Rails resolves a constant through its lexical namespace (`ActiveSupport::Inflector#constantize` / `Module#const_get`, activesupport/lib/active_support/inflector/methods.rb:271), never by a global name table.

## Acceptance criteria

- `modelRegistry` keys by `classKey`, or by namespace-qualified name, and an association target resolves to the model in the referencing file's namespace first.
- A test with two same-named models in different directories imports the correct one for each referrer.
