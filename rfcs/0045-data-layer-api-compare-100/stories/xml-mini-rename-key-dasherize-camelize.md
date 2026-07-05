---
title: "xml-mini-rename-key-dasherize-camelize"
status: in-progress
updated: 2026-07-05
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 4617
claim: "2026-07-05T15:22:28Z"
assignee: "xml-mini-rename-key-dasherize-camelize"
blocked-by: null
---

## Context

`ActiveSupport::XmlMini.rename_key` (`activesupport/lib/active_support/xml_mini.rb:152-159`)
applies two key-transform options to every XML tag name produced by `to_xml`:

- `dasherize` (default `true`) — converts `snake_case` keys to `dashed-keys`.
- `camelize` (`true` or a `:lower`/`:upper` arg) — camelizes the key first.

Both `Array#to_xml` (collection root/children, `conversions.rb:200-202`) and the
per-record `ActiveModel::Serializers::Xml` / `XmlMini.to_tag` path read the SAME
options hash, so `dasherize: false` / `camelize:` affect the collection root,
the child element name, AND every attribute tag uniformly
(`activesupport/test/core_ext/array/conversions_test.rb:171-189`).

trails currently hardcodes dasherization in two places and exposes no
`dasherize:`/`camelize:` option:

- `packages/activemodel/src/model.ts` `Model#_hashToXml` — `const tag = dasherize(key)`.
- `packages/activerecord/src/relation/delegation.ts` `Relation#toXml` — root/child
  tags via `dasherize(...)`.

Supporting these options at only one level (e.g. the collection root) produces
internally inconsistent output, so the convergence must thread a shared
`renameKey(key, { dasherize, camelize })` helper through BOTH serializers.

**Structural deviation to resolve as part of this story:** trails serializes
**camelCase** attribute keys (per the camelCase-only convention), whereas Rails
serializes `snake_case` keys and dasherizes them. The cited `conversions_test.rb`
dasherize/camelize assertions operate on `snake_case` Ruby keys; reproducing the
exact dashed/underscored output requires deciding how trails' camelCase keys map
through `rename_key` (underscore-first, then dasherize/camelize) so the tag names
match Rails verbatim.

## Acceptance criteria

- Port `XmlMini.rename_key` as a shared helper honoring `camelize` (true / `:lower`
  / `:upper`) and `dasherize` (default true).
- Thread `dasherize:`/`camelize:` through `Model#toXml`/`_hashToXml` AND
  `Relation#toXml` (root, children, and per-record tags) from the same options hash.
- Resolve the camelCase→snake_case key-mapping so output tag names match Rails
  (`conversions_test.rb:171-189` for the array cases; the corresponding
  `xml_serialization` model cases for the single-record path).
- No api:compare / test:compare regression.
