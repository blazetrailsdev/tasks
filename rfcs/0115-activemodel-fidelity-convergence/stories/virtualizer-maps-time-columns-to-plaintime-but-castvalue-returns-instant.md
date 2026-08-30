---
title: "virtualizer-maps-time-columns-to-plaintime-but-castvalue-returns-instant"
status: ready
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/type-virtualization/type-registry.ts` maps the Rails
attribute type `"time"` to `import("@blazetrails/date").Temporal.PlainTime`, so
the virtualizer generates `get duration(): Temporal.PlainTime` for a `time`
column (see fixture `type-virtualization/fixtures/21-temporal-types`, and the
`Event`/`duration` case in `virtualized-dx-tests/virtualized-patterns.test-d.ts`).

`ActiveRecord::Type::Time#cast_value`
(`vendor/rails/activerecord/lib/active_record/type/time.rb:25-30`) never returns
a bare time-of-day: `ActiveModel::Type::Time#cast_value`
(`vendor/rails/activemodel/lib/active_model/type/time.rb:66-88`) prefixes the
dummy date `2000-01-01` and builds a full `Time`. Probed in trails:
`new Time().cast("5:42:00AM")` returns `Temporal.Instant 2000-01-01T05:42:00Z`.
PR #7228 widened `Type::Time#castValue` to `Temporal.Instant | TimeWithZone |
null`, which is what a generated `time` reader should be typed.

The same wrong type is hand-written on the canonical model:
`packages/activerecord/src/test-helpers/models/topic.ts:37` declares
`bonus_time: Temporal.PlainTime`.

Note `time-value.ts:29,153` legitimately mentions `PlainTime` on the _input_
side (`user_input_in_time_zone` accepts one); only the cast/reader type is
wrong.

## Acceptance criteria

- [ ] `ATTRIBUTE_TYPE_MAP.time` in `type-virtualization/type-registry.ts` names
      the type `Type::Time#castValue` actually returns.
- [ ] The `21-temporal-types` fixture and the `duration` assertion in
      `virtualized-dx-tests/virtualized-patterns.test-d.ts` follow.
- [ ] `topic.ts`'s `bonus_time` declare is corrected, with the call-site casts
      the change makes redundant deleted.
- [ ] `pnpm typecheck`, `pnpm test:types:virtualized` and the AR suite green on
      all three lanes.
