---
title: "singleton-class-per-object-idiom"
status: draft
updated: 2026-09-22
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

Ruby `obj.singleton_class` gives one object its own class, and `obj.class` skips it. JS has no per-object class: `record.constructor` is the only class seat. The repo has no settled idiom for it.

Blocks `assertions-uniqueness-singleton-and-forced-encoding-residue` item 1: `vendor/rails/activerecord/test/cases/validations/uniqueness_validation_test.rb:109-117` calls `t2.singleton_class.validates(:title, uniqueness: true)`, so only `t2` gets the validator. A per-instance `class extends Topic {}` is not a substitute: `UniquenessValidator#findFinderClassFor` (`packages/activerecord/src/validations/uniqueness.ts:139`, Rails `validations/uniqueness.rb:58-68`) walks `record.constructor`, picks the subclass, and adds an STI `type = '...'` condition, so the duplicate is never found. The port (`packages/activerecord/src/validations/uniqueness-validation.test.ts:146`) validates on `Topic` and drops the `t3` arm.

## Acceptance criteria

- A singleton-class idiom is chosen and documented in CLAUDE.md: per-object validators/methods where `record.class` (as the class-reading call sites use it) still resolves to the real class. Or the story is closed with a ratified language shortcoming.
- `validate uniqueness with singleton class` is ported verbatim (t2 invalid, t3 valid), and its row leaves `pnpm parity:test -- --package activerecord --assertions --missing`.
