---
title: "trails-tsc: synthesize members for ActiveModel::Attributes classes"
status: draft
updated: 2026-10-31
rfc: "0035-tsserver-editor-plugin"
cluster: null
packages: ["trails-tsc"]
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

The zero-declare path covers table-backed models only. A class that does `include(this, Attributes)` and calls `this.attribute("owner", "string")` gets no members, and `attribute` itself is not on the static side after `include`. trailmap's `Audit` and `SessionArchive` carry `declare static attribute: AttributesClassHalf["attribute"]` plus one `declare` per attribute.

Found by `typecheck-trailmap-with-trails-tsc-and-drop-model-declares`.

## Acceptance criteria

- `this.attribute(name, type)` on an ActiveModel class synthesizes a typed member, with a test.
- `attribute` is available on the class without a `declare static`.
- trailmap's `declare`s on `Audit` and `SessionArchive` can be deleted after a re-vendor.
