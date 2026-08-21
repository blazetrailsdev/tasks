---
title: "Run the XmlMini engine and Hash.from_xml suites under each backend, as Rails does"
status: ready
updated: 2026-08-21
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
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

Rails runs its XmlMini suites **once per backend**, not once:

- `activesupport/test/xml_mini/xml_mini_engine_test.rb:8-13` defines
  `XMLMiniEngineTest.run_with_gem(gem_name)`, and `nokogiri_engine_test.rb:5`
  / `nokogirisax_engine_test.rb` subclass `XMLMiniEngineTest` inside it, so the
  whole shared engine suite re-runs under each backend.
- `activesupport/test/core_ext/hash_ext_test.rb:1024` branches on
  `ActiveSupport::XmlMini.backend.name`, i.e. the entire `Hash.from_xml` suite
  is backend-parameterized too.

trails' equivalents are backend-agnostic: `xml-mini/xml-mini-engine.test.ts`
runs only under the default REXML backend, and `xml-mini/nokogiri.test.ts` /
`nokogirisax.test.ts` hold hand-written per-backend cases rather than the
shared suite. `hash-ext.test.ts`'s `HashToXmlTest` never varies the backend.

PR #6837 removed the blocker: every backend's `parse` is now synchronous
(`xml_mini.rb:200-206` loads the parser at backend-selection time, mirroring
the file-top `require "nokogiri"` at `nokogiri.rb:3` / `nokogirisax.rb:3`), so
`Hash.fromXml` works under all three. It shipped only a three-case smoke test
(`xml-mini.trails.test.ts`, "Hash.from_xml under each XmlMini backend")
instead of the parameterization, to stay in scope.

## Converged shape

Port Rails' parameterization rather than duplicating cases per file:

1. A `runWithGem`-shaped helper mirroring `xml_mini_engine_test.rb:8-13` — it
   skips the suite when the optional `@blazetrails/nokogiri` package is absent,
   which is what Rails' `rescue LoadError` does.
2. `xml-mini/xml-mini-engine.test.ts`'s shared body runs under REXML,
   Nokogiri and NokogiriSAX, with `nokogiri.test.ts` /
   `nokogirisax.test.ts` reduced to the backend-specific overrides Rails'
   subclasses actually declare.
3. `hash-ext.test.ts`'s `HashToXmlTest` reads the current backend the way
   `hash_ext_test.rb:1024` does, so the `from_xml` assertions that differ per
   backend are expressed once.

Test names stay verbatim — `parity:test` matches on them.

## Acceptance criteria

- [ ] The shared engine suite executes under each available backend, skipping
      cleanly when `@blazetrails/nokogiri` is not installed.
- [ ] The three-case smoke test added in #6837
      (`xml-mini.trails.test.ts`, "Hash.from_xml under each XmlMini backend")
      is retired in favour of the parameterized run.
- [ ] `parity:test` delta for activesupport is non-negative.
