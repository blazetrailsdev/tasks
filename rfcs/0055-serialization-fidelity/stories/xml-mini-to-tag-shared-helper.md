---
title: "Port XmlMini.to_tag as a shared per-tag emitter (dedupe inline _hashToXml logic)"
status: done
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: 13
pr: 4752
claim: "2026-07-07T19:01:50Z"
assignee: "xml-mini-to-tag-shared-helper"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::XmlMini.to_tag` (`vendor/rails/activesupport/lib/active_support/xml_mini.rb:118-149`)
is the single reusable per-value tag emitter: it resolves the `type=` name
(`TYPE_NAMES`), applies `FORMATTING`, emits `nil="true"`/`encoding=` attributes,
calls `rename_key`, and recurses for hash/array/`to_xml`-responders. Both
`Array#to_xml` and `ActiveModel::Serializers::Xml` route every tag through it.

trails does NOT port `to_tag` as a shared helper. Instead the per-tag logic
(type inference, `nil="true"`, array/nested-hash recursion, and the
`renameKey(underscore(key), …)` call added in
`xml-mini-rename-key-dasherize-camelize`) is reimplemented inline in
`packages/activemodel/src/model.ts` `Model#_hashToXml`, and `Relation#toXml`
(`packages/activerecord/src/relation/delegation.ts`) computes root/child tags
separately. `renameKey` therefore has two call sites rather than one funnel.

The `ToTagTest` placeholders in `packages/activesupport/src/xml-mini.test.ts`
(all `it.skip`) are the Rails parity target and remain unported.

## Acceptance criteria

- Port `XmlMini.to_tag(key, value, options)` as a shared helper that emits one
  value's tag (type resolution, formatting, nil/encoding attributes, `renameKey`,
  and hash/array/`to_xml` recursion), matching `xml_mini.rb:118-149`.
- Route `Model#_hashToXml` per-attribute emission through it so the inline
  type/nil/rename logic is deduplicated.
- Un-skip the `ToTagTest` cases in `xml-mini.test.ts` (test names verbatim).
- No api:compare / test:compare regression.

Hard rules: camelCase only; NO node:_/process._; async fs only; 500 LOC ceiling.
