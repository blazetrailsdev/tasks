---
title: "Retire the invented fixtureId/compositeIdentify in favour of FixtureSet.identify/composite_identify"
status: draft
updated: 2026-08-31
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
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

`packages/activerecord/src/fixtures.ts` exports `fixtureId(label)` — a
trails-invented name for what Rails calls
`ActiveRecord::FixtureSet.identify`
(`vendor/rails/activerecord/lib/active_record/fixtures.rb:619-625`):

```ruby
def identify(label, column_type = :integer)
  if column_type == :uuid
    Digest::UUID.uuid_v5(Digest::UUID::OID_NAMESPACE, label.to_s)
  else
    Zlib.crc32(label.to_s) % MAX_ID
  end
end
```

Two call sites already carry half-receipts naming it —
`resolveFixtureId` (`fixtures.ts:180`) and `resolveCompositeRefColumn`
(`fixtures.ts:202`) are both tagged
`@noRailsEquivalent CONVERGEABLE FixtureSet.identify (fixtures.rb:619) ...`
with no story id, which is only half a receipt under CLAUDE.md.

PR #7301 added the real `FixtureSet.identify` (and
`FixtureSet.defaultFixtureModelName`, `fixtures.rb:544-548`) to serve
`GlobalID::FixtureSet`, so the Rails-named method now exists beside the
invented one and the convergence is mechanical rather than a new port.

`compositeIdentify` (`fixtures.ts:70`) is the same story against
`FixtureSet.composite_identify` (`fixtures.rb:632-638`), which is likewise
unported as a class method — note that Rails shifts each successive key column
(`(identify(label) << index) % MAX_ID`) where the TS helper multiplies by
`2 ** index`.

## Acceptance criteria

- [ ] `fixtureId` is retired in favour of `FixtureSet.identify`, with every
      call site updated; the Rails name is the only spelling left.
- [ ] `compositeIdentify` becomes `FixtureSet.compositeIdentify`, mirroring
      `fixtures.rb:632-638` including the shift.
- [ ] The two `@noRailsEquivalent CONVERGEABLE FixtureSet.identify` receipts
      in `fixtures.ts` are deleted with the divergence they described, not
      re-pointed.
- [ ] `pnpm parity:api:extra --package activerecord` shows the retired names
      gone; the extra-surface mark is tightened, never raised.
