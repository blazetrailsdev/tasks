---
title: "activesupport: fix misplaced files, inheritance and arity mismatches"
status: ready
updated: 2026-11-18
rfc: "0246-activesupport-parity-100"
cluster: api-residuals
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From `parity:api -- --package activesupport --arity --inheritance`:

- **Misplaced (3):** `core_ext/date/acts_like.rb` matches in
  `core-ext/date-and-time/calculations.ts`, and `deprecation/behaviors.rb` /
  `deprecation/reporting.rb` match in `deprecation.ts`.
- **Inheritance (13):**
  - 11 are core-class reopens with no trails class: `hash-utils.ts:Hash`,
    `class-attribute.ts:Class`, `core-ext/date-and-time/compatibility.ts:DateTime`,
    `core-ext/enumerable.ts:Range`, `core-ext/tse/util.ts:ERB`,
    `core-ext/file/atomic.ts:File`, `index.ts:Integer`,
    `core-ext/load-error.ts:LoadError`, `core-ext/name-error.ts:NameError`,
    `core-ext/object/acts-like.ts:Object`, `core-ext/object/json.ts:Data`.
  - `descendants-tracker.ts:WeakSet`: Rails' `WeakSet < WeakMap`, trails
    has no superclass.
  - `xml-mini/nokogirisax.ts:HashBuilder`: Rails' `< Nokogiri::XML::SAX::Document`,
    trails has no superclass.
- **Arity (4):** `cache.ts:_instrument` (Ruby keyword args flattened to
  positionals), `core-ext/array/extract.ts:extractBang` (the block is a
  positional `predicate`), and `subscriber.ts:_addEventSubscriber` /
  `_removeEventSubscriber` (an extra `state` parameter).

## Acceptance criteria

- [ ] Move the three misplaced members into files that mirror their Rails
      paths (`core-ext/date/acts-like.ts`, `deprecation/behaviors.ts`,
      `deprecation/reporting.ts`).
- [ ] Receipt the 11 core-class rows under "Core extensions are not installed
      on native prototypes", in the API tool's skip list, with a
      `PERMANENT:` reason.
- [ ] Give `WeakSet` and `HashBuilder` their Rails superclasses.
- [ ] Fix the 4 arity rows, or receipt them under § "Override arity".
- [ ] `parity:api` shows misplaced 0, inheritance 100% and arity 100%.
