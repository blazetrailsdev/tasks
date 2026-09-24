---
title: "Reach select-alias attributes through a Rails-named attribute method, not defineDynamicSelectReaders"
status: in-progress
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: 9
pr: trails#8040
claim: "2026-09-24T16:13:07Z"
assignee: "converge-invented-association-scope-and-key-helpers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `relabel-invented-model-and-relation-helper-permanent-receipts`.
`defineDynamicSelectReaders(record)` (`inheritance.ts`, called from
`base.ts`, `persistence.ts` and `inheritance.ts`) installs per-instance
accessors for every attribute a record carries that its class does not
declare — `select("title AS t")`'s `t`. Rails has no such step: an undeclared
attribute is reached through `ActiveModel::AttributeMethods#method_missing`
/ `respond_to?` (`activemodel/lib/active_model/attribute_methods.rb:510-533`)
and `ActiveRecord::AttributeMethods#respond_to?`
(`activerecord/lib/active_record/attribute_methods.rb`), which match the name
against `@attributes`.

CLAUDE.md § "Records are not Proxies" rules out the trap, so reads must be
installed somewhere; the question this story answers is whether they can be
installed through the Rails-named attribute-method path
(`define_attribute_method` on the record's singleton class —
`rbObjSingletonClass`, CLAUDE.md § "`singleton_class` is a per-object
subclass") rather than an invented function.

## Acceptance criteria

- Select-alias reads go through a Rails-named method, and
  `defineDynamicSelectReaders` is deleted — or the story is blocked naming
  the specific TS language shortcoming.
