---
title: "Enroll XMLMiniEngineTest against the REXML backend"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6471
claim: "2026-08-13T15:55:42Z"
assignee: "port-relation-sum-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/test/xml_mini/xml_mini_engine_test.rb` is the shared
engine suite every backend test inherits (`REXMLEngineTest < XMLMiniEngineTest`,
`rexml_engine_test.rb:5`). Its trails counterpart
`packages/activesupport/src/xml-mini/xml-mini-engine.test.ts` is still a
PERMANENT-SKIP stub holding all 20 Rails test names.

PR #6449 removed the blocker: `XmlMini_REXML` is ported
(`packages/activesupport/src/xml-mini/rexml.ts`), it is the default backend, and
the REXML slice it drives (`packages/activesupport/src/rexml/document.ts`)
already handles the cases the suite exercises — CDATA, adjacent and
non-adjacent text, attributes, nesting, and the entity-expansion attack
(`xml_mini_engine_test.rb:51-68`, which raises `RuntimeError` here as in MRI).

Two of the 20 need work beyond enrollment:

- `test_file_from_xml` (`xml_mini_engine_test.rb:20-49`) goes through
  `Hash.from_xml`, which needs `XmlMini::PARSING` (filed separately as
  `port-xml-mini-parsing-table`) to reach `_parse_file`.
- `test_parse_from_io` wraps the document in an IO; trails' backend signature
  takes a string (`XmlMiniBackend` in `xml-mini.ts`), so the trails analog is
  the string arm.

## Acceptance criteria

- `xml-mini-engine.test.ts` is enrolled against the REXML backend with the Rails
  test names verbatim; any test that genuinely needs `PARSING` stays skipped
  with a pointer to that story rather than being renamed or dropped.
- `parity:test` delta non-negative for `xml_mini/xml_mini_engine_test.rb`.
