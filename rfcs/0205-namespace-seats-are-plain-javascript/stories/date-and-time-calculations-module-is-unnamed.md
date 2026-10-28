---
title: "activesupport: the DateAndTime::Calculations module Date and Time include has no name"
status: done
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9404
claim: "2026-10-28T14:49:24Z"
assignee: "retire-array-helper-rows-after-native-sweep"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8853. In the workspace test setup, `rbModAncestors` of `@blazetrails/date`'s
`Date` and `Time` lists a module with no name between the class and `Comparable`:
`rbModName` answers `null` for it, and its keys are `DAYS_INTO_WEEK`, `WEEKEND_DAYS`, `yesterday`,
`tomorrow`, `isToday`, which is `packages/activesupport/src/core-ext/date-and-time/calculations.ts`.
Rails' module is the constant `DateAndTime::Calculations`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/date_and_time/calculations.rb:6-7`),
included by `Date` (`core_ext/date/calculations.rb:13`) and `Time`
(`core_ext/time/calculations.rb:14`), so `Date.ancestors` reads
`[Date, DateAndTime::Calculations, DateAndTime::Zones, Comparable, Object, ...]`.

Because the module is unnamed, `packages/ruby-compat/src/include.test.ts` ("lists MRI's ancestors
for a core class") has to drop unnamed entries before asserting the chain of the `DateTime` and
`Time` seats, and `rbModToS` / `inspect` of the module cannot render Rails' name.

A constant is pathed by seating it (`rbModConstSet(Namespace, "Name", mod)`; CLAUDE.md,
"Call-time constant resolution").

## Acceptance criteria

- [ ] The module `Date` and `Time` include for `date_and_time/calculations.rb` answers
      `"DateAndTime::Calculations"` from `rbModName`, and any sibling module mixed into them the
      same way (`DateAndTime::Zones`, `DateAndTime::Compatibility`) answers its Rails name.
- [ ] `include.test.ts`'s ancestors test asserts the date seats' chain without filtering unnamed
      entries.

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
