---
title: "build_point converts with Kernel#Float and raises, instead of nulling out an unparseable coordinate"
status: draft
updated: 2026-08-17
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6619 (RFC 0096 `wave-4-naming-ar-adapters`). The naming row
`oid/point.ts` / `buildPoint` / `new` (`ref:Float` x2 -> `ref:fx`/`ref:fy`)
cannot be renamed away, because the two sides do different things.

Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/oid/point.rb:63-65`):

```ruby
def build_point(x, y)
  ActiveRecord::Point.new(Float(x), Float(y))
end
```

`Kernel#Float` RAISES `ArgumentError`/`TypeError` on anything it cannot
convert — a malformed point literal is a loud failure.

trails
(`packages/activerecord/src/connection-adapters/postgresql/oid/point.ts:115-120`)
routes both coordinates through a trails-invented `toCoordinate` that returns
`null` on failure, then guards and returns `null` for the whole point:

```ts
private buildPoint(x: unknown, y: unknown): PointValue | null {
  const fx = this.toCoordinate(x);
  const fy = this.toCoordinate(y);
  if (fx == null || fy == null) return null;
  return new PointValue(fx, fy);
}
```

So an unparseable coordinate silently casts to `null` where Rails raises, and
`castValue`/`serialize` inherit the swallow. The two locals exist only to hold
the nullable results.

## Acceptance criteria

- [ ] `buildPoint` mirrors point.rb:63-65 — one expression, both coordinates
      converted at the call site, raising the Rails error class and message on
      an unconvertible value rather than returning null.
- [ ] `toCoordinate` either becomes the trails spelling of `Kernel#Float`
      (raising), or is removed in favour of it; no nullable coordinate arm
      survives.
- [ ] The `point.ts` naming row clears in
      `pnpm parity:api:calls:args:report`, with no new `shape` row.
- [ ] PostgreSQL lane green (point-type tests), and a test covers the raising
      arm.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
