---
title: "port-hash-from-xml"
status: ready
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
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

`Hash.from_xml` (`vendor/rails/activesupport/lib/active_support/core_ext/hash/conversions.rb:141-155`,
with `ActiveSupport::XMLConverter` at `conversions.rb:158-244`) is unported.
`XmlMini.parse` and `XmlMini::PARSING` both landed (#6449, #6465), so the
typecast table the converter dispatches through is available — nothing builds
the deep hash on top of it.

Two trails tests are affected:

- `packages/activesupport/src/xml-mini/xml-mini-engine.test.ts` — `file from xml`
  (`vendor/rails/activesupport/test/xml_mini/xml_mini_engine_test.rb:35-47`) is
  skipped, and asserts `hash["blog"]["logo"]` comes back as the `FileLike`
  StringIO shim with `original_filename` / `content_type`.
- `exception thrown on expansion attack` in the same file goes through
  `XmlMini.parse` directly where Rails goes through `Hash.from_xml`
  (`xml_mini_engine_test.rb:49-68`); route it back once `fromXml` exists.

## Acceptance criteria

- `Hash.fromXml` (and `fromTrustedXml`) land at the Rails path with the Rails
  `disallowedTypes` / `DISALLOWED_TYPES` names and the `XMLConverter` +
  `DisallowedType` error.
- `xml-mini-engine.test.ts`'s `file from xml` is unskipped and passes.
- `parity:api` / `parity:test` deltas non-negative.
