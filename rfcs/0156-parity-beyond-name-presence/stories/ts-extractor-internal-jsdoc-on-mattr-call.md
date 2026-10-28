---
title: "Extractor: honor @internal on a mattrAccessor/cattrAccessor .call statement"
status: draft
updated: 2026-10-27
rfc: "0156-parity-beyond-name-presence"
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

`extract-ts-api.ts` `classAttributeCall` (~`:3681-3695`) only marks generated
members `internal` for the `attr_internal*` macros. A `/** @internal */` JSDoc
on a top-level `mattrAccessor.call(Mod, "x")` / `cattrAccessor.call(...)`
statement is ignored, so the generated reader/writer members are scored as public
surface. Rails' `mattr_accessor` under `private` produces private methods
(`activesupport/lib/active_support/core_ext/module/attribute_accessors.rb:55-59`
defines through `class_eval`, so the visibility in effect applies). Found while
writing the countTsInternalNames fixture on trails#9385, which had to build the
module by hand because no source path produced an internal module-only member.

## Acceptance criteria

- An `@internal` JSDoc on a `mattrAccessor` / `cattrAccessor` / `mattrReader` /
  `mattrWriter` `.call` statement marks every generated member `internal`.
- An extractor fixture covers it, together with the `countTsInternalNames` count
  for a synthesized file module that carries such a member.
- Internal marks move only through `parity:api:extra:tighten`.
