---
title: "Generators' log drops options.quiet? and say_status, formatting the status line inline"
status: draft
updated: 2026-09-07
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Actions#log`
(`railties/lib/rails/generators/actions.rb:450-457`):

```ruby
def log(*args) # :doc:
  if args.size == 1
    say args.first.to_s unless options.quiet?
  else
    args << (behavior == :invoke ? :green : :red)
    say_status(*args)
  end
end
```

PR #7591 ported `log` into `packages/trailties/src/generators/actions.ts` at its
Rails home, so its call sites (`execute_command`, `generate`,
`add_key_file`, `add_master_key_file`, `ignore_key_file`) now spell Rails' call.
The body itself is only half converged:

- **The single-arg arm drops the `options.quiet?` guard** and always writes to
  the sink. trails' `GeneratorOptions` (`generators/base.ts:11-14`) is
  `{ cwd, output }` — there is no Thor options object, so there is nothing to
  branch on today.
- **The multi-arg arm drops `say_status` and the `behavior == :invoke ?
:green : :red` colour argument**, formatting the status line inline
  (`rjust(12)` + two spaces, Thor's `say_status` shape) instead. It carries a
  `@missingRailsCall say_status — PERMANENT` receipt.

Neither `say` nor `quiet?` is in the measured call population — `parity:api`'s
`output/call-mismatches.json` lists exactly one suppressed row for `log`
(`say_status`) — so a `@missingRailsCall quiet?` tag is reported STALE and reds
`pnpm parity:api:calls`. That is why the omission is recorded in #7591's body
rather than at the call site, and why it needs a story instead.

## Converged shape

- A generator options object carrying Thor's `quiet` (and `behavior`), so the
  single-arg arm can spell `unless options.quiet?` and the multi-arg arm can
  pick `:green` / `:red` from `behavior`.
- `say` / `say_status` ported as the sink's two shapes, so `log`'s body is
  Rails' four lines and the receipt disappears.

## Acceptance criteria

- [ ] `log`'s single-arg arm is guarded by `options.quiet?`.
- [ ] The multi-arg arm appends the colour from `behavior` and calls
      `say_status`, whose padding is Thor's (`rjust(12)` + two spaces).
- [ ] The `@missingRailsCall say_status` receipt at
      `generators/actions.ts` is deleted, not rewritten.
- [ ] `pnpm parity:api:calls` / `parity:api:calls:args` green.
