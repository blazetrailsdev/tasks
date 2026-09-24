---
title: "ar-base-abstract-class-message-lacks-module-path"
status: claimed
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-09-24T17:44:04Z"
assignee: "activesupport-time-with-zone-subnanosecond-fractions"
blocked-by: null
closed-reason: null
---

## Context

`Base.new()` on the abstract root raises
`"Base is an abstract class and cannot be instantiated."`
(`packages/activerecord/src/base.ts:746`), where Rails raises
`"ActiveRecord::Base is an abstract class and cannot be instantiated."` —
`raise NotImplementedError, "#{self} is an abstract class and cannot be
instantiated."` (`vendor/rails/activerecord/lib/active_record/inheritance.rb:58`,
interpolating `Module#to_s`).

Surfaced by `inheritance_test.rb › new with ar base` while converging that file
to 0 assertion mismatches (trails#TBD, RFC 0132): the test now ports Rails'
`assert_equal(..., e.message)` and is the sole remaining assertion-VALUE
mismatch in `inheritance_test.rb`.

The blocker is that trails has no Ruby module path for `Base`. `qualifiedName`
(`packages/activerecord/src/inheritance.ts:91`) reads `static moduleName` /
`static _demodulizedName`, and TS statics are inherited — so setting
`Base.moduleName = "ActiveRecord"` would give EVERY model the
`ActiveRecord::` prefix, changing `stiName`, `computeTypeCandidates`
(`inheritance.ts:43`) and the SubclassNotFound message. A fix needs an
own-property-only notion of the root's Ruby name.

Note the sibling raise site at `inheritance.ts:280` was converged in the same
PR: `Invalid single-table inheritance type: #{subclass.name} …`
(`inheritance.rb:316`) now interpolates `qualifiedName(...)` rather than the JS
`.name`, so `Namespaced::Firm` reads as Rails spells it.

## Acceptance criteria

- `Base.new()` raises with the Rails message text
  (`ActiveRecord::Base is an abstract class and cannot be instantiated.`),
  without giving subclasses an inherited `ActiveRecord::` module prefix.
- `packages/activerecord/src/inheritance.test.ts › new with ar base` asserts the
  Rails literal, and `pnpm parity:test -- --package activerecord --assertions
--missing` reports no value mismatch for `inheritance_test.rb`.
- `pnpm vitest run packages/activerecord/src/inheritance.test.ts` and
  `packages/activerecord/src/base.trails.test.ts` stay green.
