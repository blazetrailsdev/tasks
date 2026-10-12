---
title: "ruby-compat: Marshal TYPE_STRUCT writes camelCase member names and drops a Struct's ivars"
status: draft
updated: 2026-10-12
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

trails#8827 ported `TYPE_STRUCT` for `Marshal.dump` / `Marshal.load` (`packages/ruby-compat/src/marshal.ts`; `vendor/ruby/v3.3.11/marshal.c:1094-1108`, `2133-2184`). Two parts of MRI's arms are not matched:

1. **Member names.** MRI writes each member as its Symbol (`w_symbol(RARRAY_AREF(mem, i), arg)`, `marshal.c:1104`). The port writes `members()` verbatim, and a trails `Struct.new` takes camelCase member names, so a multi-word member (`Struct.new("fooBar")`) dumps as `:fooBar` where Ruby writes `:foo_bar`, and a Ruby-written dump of that Struct fails the load-side name check (`marshal.c:2166`, "struct … not compatible (:foo_bar for :fooBar)"). `wIvarEach` already spells an ivar by the field-name rule (`fooBar` is `@foo_bar`); members need the same translation in both directions. `Arel::Attributes::Attribute` (`relation`, `name`) is unaffected, which is why the round-trip tests pass.
2. **Instance variables on a Struct.** MRI wraps any non-`T_OBJECT` value that has ivars in `TYPE_IVAR` (`has_ivars`, `marshal.c:709`; `w_ivar`, `:763`). The port's `hasIvars` reads the encoding only, so own fields set on a Struct instance are dropped by `Marshal.dump`.

## Acceptance criteria

- [ ] A Struct member is dumped under its Ruby Symbol and matched against it on load, with a multi-word member tested against bytes from ruby 3.3.11.
- [ ] A Struct instance's own ivars round-trip, tested against bytes from ruby 3.3.11, or the arm is shown unreachable and documented in `Marshal.dump`'s "Not ported" list.
