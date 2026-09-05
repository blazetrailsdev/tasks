---
title: "oid-point-cast-and-serialize-null-out-instead-of-falling-through"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
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

Surfaced in review of #7517 (RFC 0130,
`receipt-connection-adapters-and-sqlite-drivers`), which repointed
`adapters/postgresql/geometric.test.ts` at this type and so put its fallback
arms under a test for the first time. The divergence itself predates that PR and
was explicitly left out of its scope.

`packages/activerecord/src/connection-adapters/postgresql/oid/point.ts` turns
every unrecognized input into `null`. Rails
(`activerecord/lib/active_record/connection_adapters/postgresql/oid/point.rb`)
passes it through:

- `cast` (`:16-34`) ends `else value` — the value is returned UNCHANGED. The
  port returns `null`.
- `serialize` (`:36-47`) ends `else super`, so `ActiveModel::Type::Value#serialize`
  sees it. The port instead has an extra `if (typeof value === "string") return value`
  arm Rails does not have, then `return null`.

Two narrower arms diverge the same way, by adding a guard Rails does not have:

- String arm (`:18-25`): Rails does `x, y = value.split(",")` and calls
  `build_point(x, y)` with whatever came out — `Float(nil)` then raises
  `ArgumentError` on a malformed value. The port returns `null` when
  `parts.length !== 2`.
- Array arm (`:26-27`): Rails splats unconditionally, `build_point(*value)`. The
  port returns `null` when `value.length !== 2`.

The net effect is that a malformed point silently becomes `nil` where Rails
either round-trips it or raises. `type_cast_for_schema` (`:49-55`) already ends
`else super` correctly and is not in scope.

`values_array_from_hash` is NOT a divergence: Rails'
`value.values_at(:x, "x").compact.first` reads a Symbol or String key, and both
collapse to the same JS property, so the port's `value.x ?? value["x"]` is
faithful.

## Acceptance criteria

- `cast`'s and `serialize`'s final arms pass the value through the way
  `point.rb:31-32` and `:44-45` do, `serialize` via `super`.
- The invented `parts.length !== 2` / `value.length !== 2` guards are gone, so a
  malformed point reaches `buildPoint` and raises the way `Float(nil)` does.
- The extra string arm in `serialize` is gone.
- `pnpm parity:api:calls` / `:args` show no new rows, and the PostgreSQL lane
  stays green.
