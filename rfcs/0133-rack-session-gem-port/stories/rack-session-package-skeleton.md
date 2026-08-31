---
title: "Create packages/rack-session: a workspace package over the vendored gem, depending only on rack"
status: draft
updated: 2026-08-31
rfc: "0133-rack-session-gem-port"
cluster: null
packages: [rack-session]
deps: [vendor-rack-session-source]
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 2. The package exists before anything moves into it, so every later
relocation is a pure move against a working target rather than a move plus a
scaffold — the shape `0129-ruby-compat/ruby-compat-package-skeleton` (PR 7230)
established.

Model the scaffold on `packages/rack/` (`package.json` is 17 lines) rather than
on `packages/ruby-compat/`: unlike `ruby-compat`, this package is **not** a
leaf. `rack-session` the gem requires `rack` (`Rack::Request`,
`Rack::Utils.set_cookie_header`, `Rack::Response`), and trails already ships
`@blazetrails/rack`, so exactly one workspace dependency is correct and
expected. There is no C-surface problem and no leaf-dependency problem here —
that is what makes this RFC cheap relative to 0129.

Src layout mirrors the gem under its module root, matching how
`packages/rack/src/**` mirrors `lib/rack/**`:
`lib/rack/session/abstract/id.rb` → `packages/rack-session/src/abstract/id.ts`,
`pool.rb` → `src/pool.ts`, `cookie.rb` → `src/cookie.ts`.

Cross-package registration is easy to half-do and `pnpm typecheck` passes
without it (memory: "new cross-package subpath = 4 registrations"): the
`vitest.config.ts` alias needs a trailing-slash subpath entry **above** the
bare one, and both `vitest.dx-tests.config.ts` tsconfigs need the `paths` entry.

## Acceptance criteria

- `packages/rack-session/` with `package.json` (`@blazetrails/rack-session`,
  one dependency: `@blazetrails/rack": "workspace:*"`), `tsconfig.json`, build
  wiring, and `src/index.ts` exporting nothing yet.
- Registered in `pnpm-workspace.yaml`, the root `tsconfig.json` references, the
  `vitest.config.ts` aliases (trailing-slash entry above the bare one), and both
  `vitest.dx-tests.config.ts` tsconfigs.
- `packages/actionpack/package.json` gains
  `"@blazetrails/rack-session": "workspace:*"`, mirroring
  `actionpack.gemspec:40`. No import uses it yet.
- `packages/rack-session/README.md` states the contract: the package mirrors
  the vendored gem at `vendor/rack-session/`, every member cites
  `vendor/rack-session/lib/rack/session/<file>.rb:LINE`, `parity:api` and
  `parity:test` both run over it (unlike `date`/`minitest`), and it takes no
  workspace dependency other than `@blazetrails/rack`.
- No empty stubs or placeholder interfaces (CLAUDE.md) — an `index.ts`
  exporting nothing is the whole surface until `relocate-rack-session-scaffolding-out-of-actionpack`.
- `pnpm typecheck`, `pnpm test:types`, `pnpm lint` pass; `pnpm parity:api` /
  `parity:test` deltas non-negative.
