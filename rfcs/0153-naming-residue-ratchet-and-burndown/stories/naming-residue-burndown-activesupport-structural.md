---
title: "naming-residue-burndown-activesupport-structural"
status: done
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: ["call-args-recorder-self-call-receiver-as-argument"]
deps-rfc: []
est-loc: null
priority: 45
pr: trails#8051
claim: "2026-09-24T18:26:42Z"
assignee: "naming-residue-burndown-activesupport-structural"
blocked-by: null
closed-reason: null
---

## Context

Split out of `naming-residue-burndown-activesupport` (RFC 0153 W2) by the LOC ceiling. That story converged the rename-shaped activesupport rows, receipted every permanent row in the slice, and extended the taxonomy (`RUBY_COMPAT_EXPORTS` pairs such as `Float`/`kernelFloat`, `collect`/`map`, `pack`/`fromCodePoint`, `Kernel#Integer`). **13 convergeable rows remain**, and activesupport is not enrolled yet, because none of them is a plain rename:

- `values/time-zone.ts` `iso8601` / `rfc3339` / `partsToTime` — `TimeWithZone.new(time.utc, self)` (`values/time_zone.rb:407-420,484,604`). trails builds a `Temporal.PlainDateTime` and applies the offset in `utcInstantOf`. Rails builds `Time.new(..., offset)` and takes `.utc`. To converge, build a `@blazetrails/date` `Time` with the offset and pass its `utc()`.
- `message-pack/extensions.ts` `writeTimeWithZone` — `write_time(twz.utc, packer)` (`message_pack/extensions.rb:170-173`). `writeTime` takes a `Temporal.Instant` (the type-129 seat), so the TS spells `twz.utc().toTime().toInstant()`. `write_time` reads `tv_sec`/`tv_nsec`/`utc_offset` (`:160-164`), and those exist on `Time` as `toI`/`nsec`/`utcOffset`.
- `message-pack/serializer.ts` `load` — `message_pack_pool.unpacker do |unpacker| unpacker.feed_reference(dumped) ...` (`message_pack/serializer.rb:19-25`). TS passes `dumped` to the pool instead of yielding an unpacker.
- `cache/coder.ts` `load` — `load_version(dumped.byteslice(PACKED_VERSION_INDEX, version_length))` (`cache/coder.rb:50-56`). The trails wire format is a JSON header, not Rails' `pack`ed binary header.
- `time-with-zone.ts` `toTime` — `getlocal(time_zone)` (`time_with_zone.rb:493-501`). `Time#getlocal` (`packages/date/src/time.ts`) takes no zone object, so TS passes `tzinfo.identifier`.
- `notifications.ts` `instrument` — the Ruby recorder records `instrumenter.instrument(name, payload)` (`notifications.rb:208-214`) with the receiver as an argument. The TS branch order is also inverted (`if !listening` first). This one is partly recorder shape: file a taxonomy/recorder story if the pairing is wrong.
- `array-utils.ts` `toXml` — `underscore(first.class.name)` (`core_ext/array/conversions.rb:191`) against `underscore(rbObjClass(first))`: `rbObjClass` answers the class NAME.
- `multibyte/chars.ts` `compose` / `decompose` — `codepoints.to_a` (`multibyte/chars.rb:136,144`): `to_a` is a no-op on an Array that TS does not spell.
- `string-utils.ts` `indent` — `dup.tap { |_| _.indent!(...) }` (`core_ext/string/indent.rb:43`).
- `core-ext/date/calculations.ts` `plusWithDuration` (`module-mixin-receiver`) — `other.since(self)` (`core_ext/date/calculations.rb:90-96`). Rewire to a `this`-typed function. It was dropped from the parent PR only for size: about 110 LOC of `.call(date, …)` churn across `duration.test.ts`, `numeric-ext.test.ts` and `date-ext.trails.test.ts`.

## Acceptance criteria

- [ ] `pnpm parity:api:calls:args:report` shows 0 `burndown` and 0 `module-mixin-receiver` rows under `activesupport`.
- [ ] Rows whose classification is wrong get a taxonomy story under 0153 and no receipt.
- [ ] Add `activesupport` to `NAMING_ENROLLED_PACKAGES`, with `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:params` green.
