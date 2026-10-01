---
title: "ruby-compat: one include? call for Array/Hash/Set/Range, so Thor's enum check is one call"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Arguments#validate_enum_value!` makes one call,
`switch.enum.include?(value)` (`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:179`).
The port (`packages/trailties/src/thor/parser/arguments.ts`,
`validateEnumValueBang`, trails#8347) spells it as four arms, one per class
`Argument#validate!`'s `is_a?(Enumerable)` (`parser/argument.rb:64`) admits:
Array `includes`, Set / `Hash` `has`, `Range#isInclude`, and `hasKey` for a
plain-object Hash. `Argument#enumToS` (`parser/argument.rb:46-52`) likewise
tests `instanceof Set` beside `rbObjRespondTo(enum, "join")`, because a JS Set
has no `join` where Ruby's `Set#join` exists.

ruby-compat has no generic `include?`. `isInclude` (`packages/ruby-compat/src/hash.ts`)
is `Hash#include?` only (`hasKey`). `basicObjRespondTo`
(`packages/ruby-compat/src/object.ts`) already answers `isInclude` as bound for
Array, Hash, String and Set, but `rbFSend(ary, "isInclude", v)` raises
`NoMethodError`, because `sendInternal` finds no such member on the JS value.
So `respond_to?` and `send` disagree for those receivers.

The report-only arms report shows the cost: `thor/parser/arguments.ts#validateEnumValueBang  count  +if +if +if`.

## Acceptance criteria

- [ ] One ruby-compat call answers `include?` for Array (`array.c:8679`), Hash
      (`hash.c:7255`), Set (`lib/set.rb:393`), `Range` and String, either a
      dispatching function or `rbFSend` binding the same core receivers
      `basicObjRespondTo` already reports. It carries its `@noRailsEquivalent PERMANENT` receipt.
- [ ] `validateEnumValueBang` is one call, as `arguments.rb:179` is, and the
      arms report row for it is gone.
- [ ] `enumToS` reaches `join` for a Set without an `instanceof Set` arm.
- [ ] The Set and Hash enum cases in `arguments.trails.test.ts` and
      `argument.trails.test.ts` still pass.
