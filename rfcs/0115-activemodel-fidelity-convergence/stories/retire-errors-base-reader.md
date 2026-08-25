---
title: "Retire Errors#base — errors.rb declares no reader for @base"
status: done
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6793
claim: "2026-08-20T21:29:07Z"
assignee: "converge-enum-undeclared-type-check-to-subtype"
blocked-by: null
closed-reason: null
---

## Context

PR #6786 took `packages/activemodel/src/errors.ts` from 10 moved names to 1.
The survivor is the public `base` getter (`errors.ts:391-393`).

`vendor/rails/activemodel/lib/active_model/errors.rb:117-120` sets `@base` in
`initialize` and declares NO reader for it. The class's only `attr_reader` is
`:errors` (:107, aliased `:objects` at :108). `@base` is read only from inside
the class — `errors.rb:139-141` (`copy!`), :156 (`import`), :344 (`add`), :452
(`full_message`), :480 (`generate_message`) — always as the bare ivar.
`Error#base` IS a real reader (`error.rb:22`), which is why the name resolves
somewhere in the Ruby tree and scores as `moved` rather than `novel`.

trails' `Errors` already keeps the value in a private `_base` field
(`errors.ts:24`); the public getter is the only extra. Its internal callers —
`errors.ts:96, :247, :318, :326` — go through `this.base` and can read
`this._base` directly, as Ruby reads `@base`.

Known external readers are two type assertions in
`packages/activemodel/src/errors.test.ts` (`expectTypeOf(e.base)`), which pin
the `TBase | null` generic rather than any behaviour. Re-grep before deleting:
`grep -rn "errors\.base\b" --include=*.ts packages`.

## Converged shape

`base` is deleted; every in-class read is `this._base`, mirroring Ruby's bare
`@base`. The two `expectTypeOf` assertions move onto a surface Rails has (or
are dropped if nothing public carries the generic).

## Acceptance criteria

- `Errors#base` no longer exists; no caller references it.
- `pnpm parity:api:extra --package activemodel` shows errors.ts at 0 novel /
  0 moved.
- Parity deltas non-negative; `pnpm parity:api:calls` / `:args` clean.
