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

Triaged under `triage-send-name-guessing-stories-against-the-direct-call-rule`
as a call-site convergence: Rails' name is a literal, so the converged shape is
a direct call to one ruby-compat `include?` port, never `rbFSend(enum, "isInclude", v)`.

`Thor::Arguments#validate_enum_value!` makes one call,
`switch.enum.include?(value)` (`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:179`).
The port (`packages/trailties/src/thor/parser/arguments.ts:213-218`,
`validateEnumValueBang`) spells it as four arms, one per class
`Argument#validate!`'s `is_a?(Enumerable)` (`parser/argument.rb:64`) admits:
Array `includes`, Set / `Map` `has`, `Range#isInclude`, and the plain-object
`isInclude`. `Argument#enumToS` (`parser/argument.rb:46-52`) likewise tests
`instanceof Set` beside `rbObjRespondTo(enum, "join")`, because a JS Set has no
`join` where Ruby's `Set#join` exists.

ruby-compat's exported `isInclude` (`packages/ruby-compat/src/hash.ts`) is
`Hash#include?` only. The report-only arms report shows the cost:
`thor/parser/arguments.ts#validateEnumValueBang  count  +if +if +if`.

## Acceptance criteria

- [ ] One ruby-compat function answers `include?` for Array (`rb_ary_includes`,
      `vendor/ruby/v3.3.11/array.c:5222`), Hash (`hash.c:7255`), Set
      (`lib/set.rb:393`), `Range` and String, dispatching on the receiver as
      `toI` does, with its `@noRailsEquivalent PERMANENT` receipt. No
      `sendInternal` change.
- [ ] `validateEnumValueBang` is one call to it, as `arguments.rb:179` is, and
      the arms report row is gone.
- [ ] `enumToS` reaches `join` for a Set without an `instanceof Set` arm.
- [ ] The Set and Hash enum cases in `arguments.trails.test.ts` and
      `argument.trails.test.ts` still pass.
