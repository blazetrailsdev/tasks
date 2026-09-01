---
title: "parity:api maps no rails/commands/*_command.rb onto trailties/commands"
status: draft
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
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

`parity:api` maps no `railties/lib/rails/commands/**/*_command.rb` onto its
trails port, so the whole `packages/trailties/src/commands/` tree scores as
"no Rails counterpart":

```text
   45      1      1  trailties        commands/routes.ts
   30      1      5  trailties        commands/unused-routes.ts
  commands/routes.ts — 1 novel, 1 moved [no Rails counterpart]
```

Rails nests each command one directory deep and suffixes the file:
`rails/commands/routes/routes_command.rb`,
`rails/commands/unused_routes/unused_routes_command.rb`. trails flattens both
to `commands/<name>.ts`, and neither `PATH_SEGMENT_ALIASES` nor
`RUBY_FILE_TS_OVERRIDES` in `scripts/parity/conventions.ts` carries a rule for
the shape. So `RoutesCommand#perform` / `#inspector` / `#formatter` /
`#routes_filter` and the `UnusedRoutesCommand` cluster ported in PR #7353 are
measured against an empty allowed set instead of their real counterparts, and
the members they DO mirror are scored as extra surface.

## Converged shape

- A conventions rule maps `railties/lib/rails/commands/<dir>/<dir>_command.rb`
  onto `trailties/commands/<dasherized dir>.ts` — via the generated rule in
  `scripts/parity/conventions.ts`, never a hand-edit of
  `docs/ruby-ts-conventions.md`.
- `pnpm parity:api --package trailties` scores the commands tree against its
  Rails files; the per-file "no Rails counterpart" rows for `commands/routes.ts`
  and `commands/unused-routes.ts` are gone.
- `scripts/parity/` tests cover the new mapping.
