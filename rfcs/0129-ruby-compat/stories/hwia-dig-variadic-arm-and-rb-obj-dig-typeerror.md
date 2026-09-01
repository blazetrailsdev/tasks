---
title: "hwia-dig-variadic-arm-and-rb-obj-dig-typeerror"
status: draft
updated: 2026-09-01
rfc: "0129-ruby-compat"
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

`HashWithIndifferentAccess#dig` (`hash_with_indifferent_access.rb:208-211`) is
two lines: convert `args[0]`, then `super(*args)`. That `super` is
`rb_hash_dig` (`vendor/ruby/hash.c:4627`), which is `rb_hash_aref` for the
first key and `rb_obj_dig` (`vendor/ruby/object.c:3906`) for every key after
it. `ruby-compat-hash-dig-and-plain-object-default-seat` converged the first
half — `packages/activesupport/src/hash-with-indifferent-access.ts:697` now
reads through `get`, so a miss yields to the default_proc the way
`rb_hash_aref` does — and left the second.

Two arms of `rb_obj_dig`'s loop are missing at
`hash-with-indifferent-access.ts:698-705`:

- **Array.** `rb_obj_dig` digs an Array intermediate through `rb_ary_at`
  (`object.c:3915`); ours returns `undefined`. `OrderedOptions#dig`
  (`packages/activesupport/src/ordered-options.ts:103-110`,
  `ordered_options.rb:45-47`) already walks one, and its
  `it("nested dig")` (`ordered-options.test.ts:73-79`) pins the behaviour —
  so the shape to match is next door.
- **The TypeError.** An intermediate that answers no `dig` is
  `no_dig_method`'s `rb_raise(rb_eTypeError, "%"PRIsVALUE" does not have #dig
  method")` (`vendor/ruby/object.c:3897-3900`); ours returns `undefined`
  silently.

The TypeError arm is the one to land carefully: today's silent `undefined` is
what every `dig` call site in the repo has been written against
(`actionpack/src/action-dispatch/dispatch/request/session.test.ts:150-151`,
`action-controller/controller/parameters/accessors.test.ts:414-427`,
`activesupport/src/hwia-module-string.test.ts:58`), so a throw where the
intermediate is a plain object rather than a nested `HashWithIndifferentAccess`
can red a distant suite. Check what `convert_value`
(`hash_with_indifferent_access.rb:392-401`) actually leaves in the hash before
assuming every intermediate is indifferent.

## Acceptance criteria

- `HashWithIndifferentAccess#dig`'s post-first-key walk mirrors `rb_obj_dig`'s
  loop: `nil` ends it, an Array intermediate is indexed, an object that
  answers `dig` is handed the remaining identifiers, anything else raises
  `TypeError` with `"<class> does not have #dig method"`.
- The `hwia-dig-variadic-arm-and-rb-obj-dig-typeerror` pointer in that
  method's JSDoc is deleted, not reworded.
- A regression test per arm that fails on the baseline, under the Rails test
  name where one exists.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` show no new
  rows; activesupport, actionpack and all three AR lanes green.
