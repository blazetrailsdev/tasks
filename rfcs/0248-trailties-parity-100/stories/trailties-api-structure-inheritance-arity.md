---
title: "trailties: fix the 8 inheritance and 6 arity mismatches"
status: ready
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: api-residuals
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Inheritance mismatches:

- `engine.ts:Engine` ruby<Railtie> ts<Trailtie → Initializable>, `test-unit/trailtie.ts:TestUnitRailtie` same shape, `trailtie.ts:Railtie` ruby<(none)> ts<Initializable> — Rails `include`s `Initializable`; see root CLAUDE.md § "Module mixins"
- `engine/configuration.ts:Configuration` ts<class missing>
- `generators/trails/app/app-generator.ts:AppBuilder` ts<ActionMethods>
- `rack/logger.ts:Logger` ruby<LogSubscriber> ts<(none)>
- `test-unit/reporter.ts:TestUnitReporter` — receipted by package CLAUDE.md § "`TestUnitReporter` has no `Minitest::StatisticsReporter` superclass"; make the tool honor it
- `test-unit/test-parser.ts:TestParser` ruby<Ripper>

Arity mismatches: `generators.ts:printList` (×2) and `printGenerators` (extra
`output`), `engine/lazy-route-set.ts:recognizePathWithRequest`,
`generators/app-base.ts:trailsGemfileEntry` and
`generators/trails/plugin/plugin-generator.ts:trailsGemfileEntry`.

## Acceptance criteria

- [ ] `parity:api -- --package trailties --arity --inheritance` shows 100% for both, with any tool-level receipt citing a section.
