---
title: "ruby-compat/date: Marshal cannot dump a Temporal.PlainDateTime (DateTime seat) or a Time seat"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

trails#8529 made a `Temporal.PlainDate`, the seat of `Date`, dump through Date's `marshal_dump`
(`vendor/ruby/v3.3.11/ext/date/date_core.c:7547-7567,9838`): `packages/date/src/date.ts` assigns
`TEMPORAL_METHOD_TABLE["Temporal.PlainDate"].marshalDump`, and `w_class`
(`packages/ruby-compat/src/marshal.ts`, `vendor/ruby/v3.3.11/marshal.c:572-588`) writes the constant
seated at the seat's class path. `Temporal.PlainDateTime` is the seat of `DateTime` in the same way
(`rbObjClass`, `packages/ruby-compat/src/object.ts:51`) and has no entry, so
`Marshal.dump(Temporal.PlainDateTime.from("2016-01-01T01:02:03"))` still raises
`TypeError: no _dump_data is defined for class DateTime`. `Type::DateTime#cast_value` answers Temporal
values, so a cast `datetime` attribute a `UserProvidedDefault#marshal_dump`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute/user_provided_default.rb:29-38`) carries
is one. A `Temporal.ZonedDateTime` and a `Temporal.Instant`, the seats of `Time`
(`object.ts:48`), have no `_dump` arm either: MRI's `Time` dumps through `time_mdump`
(`vendor/ruby/v3.3.11/time.c:5345`, `TYPE_USERDEF`), which `marshal.ts` does not port.

`ruby -rdate -e 'p Marshal.dump(DateTime.new(2016,1,1,1,2,3))'` is
`"\x04\bU:\rDateTime[\vi\x00i\x03-\x7F%i\x02\x8B\x0Ei\x00i\x00f\f2299161"`.

## Acceptance criteria

- [ ] `Marshal.dump` of a `Temporal.PlainDateTime` is byte-equal to MRI's dump of the `DateTime` it
      seats, through `DateTime`'s inherited `marshal_dump`, and `Marshal.load` of it answers an equal
      `DateTime`.
- [ ] Decide and port the `Time` seats: `w_object`'s `_dump` arm (`marshal.c:916-949`) and
      `TYPE_USERDEF` on load (`marshal.c:2185-2215`), with `Time#_dump` / `Time._load`
      (`time.c:5345-5720`), or file that half as its own story with the MRI bytes.
