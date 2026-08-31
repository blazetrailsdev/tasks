---
title: "One Comparable / <=> for the three hand-rolled spaceship implementations"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport", "date"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 190
priority: 10
pr: 7266
claim: "2026-08-30T19:46:13Z"
assignee: "ruby-compat-comparable"
blocked-by: null
closed-reason: null
---

## Context

`<=>` is the operator every value type in this RFC is ordered by, and JS has no
equivalent, so each port that needed ordering wrote its own:

- `packages/activesupport/src/range-ext.ts:15` — private `cmp(a, b)`, with a
  `boundary:` comment that Date endpoints compare as epoch millis
- `packages/activesupport/src/core-ext/date-and-time/calculations.ts:81` —
  private `compare(dateOrTime, other)`, over a local `Comparable` **type** alias
  (`:31`) that is a union of `DateOrTime | TimeWithZone | Temporal.Instant`
- `packages/date/src/date.ts:843` — `spaceship(a, b)` returning `number | null`,
  used by `DateInfinity#<=>` (`:5715-5722`) and reached from `cmpGen` (`:6039`)
  and `cmpDd` (`:6050`)

The `date.ts` one is the closest to MRI: `<=>` returns **`nil`** for an
incomparable pair, not a number. `duration.ts:867` records the same semantics —
_"returns nil for an incomparable receiver; `Duration#compareTo` spells that"_ —
and `duration.ts:885` notes `Scalar < Numeric` includes `Comparable`, so `==` is
Comparable's. That nullable return is the thing to get right: a `cmp` typed
`number` silently loses the incomparable arm, which is exactly the CLAUDE.md
"predicates return a value, not necessarily a boolean" trap in another suit.

Ruby's `Comparable` is a module mixed into a class that defines `<=>`, giving
`<`, `<=`, `>`, `>=`, `==`, `between?` and `clamp` (`compar.c`). Per the standing
rule, port **only the members trails calls** — inventory the call sites first and
let that drive the export list; `clamp` and `between?` each need a real caller or
they do not ship.

This story interacts with two others: `range-ext.ts:15` moves as part of the
Range story (coordinate — the `cmp` body belongs here, the class there), and
`rb-equal.ts` (`object.c` `rb_equal`) is the `==` arm and is **deferred** (see the RFC's _Deferred_ table),
so this story must not quietly pull it in.

Use the repo's settled mixin idiom (CLAUDE.md "Module mixins"): `include()` /
`Included<>` from `@blazetrails/activesupport` is not available to a leaf package
that takes no workspace dependencies, so `this`-typed functions assigned to the
class is the shape here — and if that proves impossible, say so rather than
inventing a new one.

## Acceptance criteria

- A `Comparable` under `packages/ruby-compat/src/` with a
  `vendor/ruby/compar.c:LINE` citation, exporting `<=>` (as `cmp`) and only the
  Comparable-derived members with real call sites, each named in the PR body
  with its caller.
- `<=>` returns MRI's nullable result — the incomparable arm answers `null`, not
  a number — and every adopting call site handles it.
- All three private implementations deleted or reduced to a call into the shared
  one; `date.ts:843`'s `spaceship` and its `DateInfinity` / `cmpGen` / `cmpDd`
  callers keep their current behaviour exactly.
- The `boundary:` comments about Date-as-epoch-millis carry across, or the
  boundary is stated once in the shared implementation.
- `ruby-compat` still takes no workspace dependencies.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:extra` show no new rows; the activesupport, date and activemodel
  suites are green.
