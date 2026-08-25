---
title: "Restore the per-file layout of Rails' XmlMini engine subclasses"
status: draft
updated: 2026-08-21
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Restore the per-file layout of Rails' XmlMini engine subclasses

## Context

PR #6839 parameterized the XmlMini engine suite over every backend. Rails
spreads that across four files — the shared `EngineTests` module plus one
subclass file per backend:

- `activesupport/test/xml_mini/xml_mini_engine_test.rb:7-33` — `XMLMiniEngineTest`,
  `run_with_gem`, `inherited` (which mixes `EngineTests` into each subclass),
  and the `XmlMini.backend=` setup/teardown. It declares every test method and
  no `engine`, so it never runs its own suite.
- `rexml_engine_test.rb:5`, `nokogiri_engine_test.rb:5`,
  `nokogirisax_engine_test.rb:5` — one subclass each, declaring only `engine`
  and `expansion_attack_error`.

trails collapsed all three subclasses into
`packages/activesupport/src/xml-mini/xml-mini-engine.test.ts`, which invokes
`engineTests()` three times, and DELETED `xml-mini/nokogiri.test.ts` and
`xml-mini/nokogirisax.test.ts`. Two things forced that:

1. JavaScript has no `inherited` hook (CLAUDE.md, "Module mixins"), so
   `EngineTests` is a function and each Ruby subclass is a call to it.
2. `parity:test` credits a Rails test file against its ONE convention TS file
   (`scripts/test-compare/compare.ts:5-12`). Every one of the ~20 test names is
   defined in `xml_mini_engine_test.rb`, so they must be registered in
   `xml-mini-engine.test.ts` or that file drops from 20/20 to 0/20 and the names
   count as misplaced in whichever file does register them. A subclass file that
   imports the shared body from a `.test.ts` re-registers the exporting file's
   own describes as a side effect, which is why the import route was rejected.

## Converged shape

Give `parity:test` a way to express "this Rails file's tests are inherited by
these TS files" — the tooling analogue of Ruby's `inherited` — so a Rails test
file can credit against more than one convention TS file without the extra
registrations counting as misplaced or extra. Then:

- `xml-mini-engine.test.ts` exports `runWithGem` and `engineTests` and registers
  only the REXML-less shared surface Ruby's abstract `XMLMiniEngineTest` has.
- `rexml-engine.test.ts`, `nokogiri.test.ts` and `nokogirisax.test.ts` each call
  `engineTests` with their own `engine` / `expansionAttackError`, mirroring
  their Ruby files one-to-one.

Note `nokogiri_engine_test.rb` and `nokogirisax_engine_test.rb` define no test
methods of their own, so they carry no `parity:test` rows today; the credit at
risk is `xml_mini_engine_test.rb`'s 20.

## Acceptance criteria

- [ ] The four Rails engine test files map one-to-one onto four TS files, each
      declaring what its Ruby counterpart declares.
- [ ] Importing the shared body does not re-register the exporting file's tests.
- [ ] `parity:test --package activesupport` delta is non-negative and
      `xml_mini_engine_test.rb` stays at 20/20 with 0 misplaced and 0 wrong
      describe.
