---
title: "trailties: '.' entry mirrors rails.rb instead of resolving to the CLI"
status: draft
updated: 2026-10-17
rfc: "0192-package-entry-point-boot-cost"
cluster: "findings"
packages: ["trailties"]
deps: ["boot-graph-measurement-harness", "trailties-main-entry-point-is-the-cli"]
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

`packages/trailties/package.json` maps `"."` to `./dist/cli.js`. Generated app code imports
`Trails` / `Application` from `@blazetrails/trailties` (`packages/trailties/src/generators/app-generator.ts:405,568,594,606`).
So any entry that is not the CLI, including a Perry AOT binary, loads the CLI module graph.
`cli.ts` loads commander, `Trails`, `Application`, `Engine`, `Trailtie` and the package-manager
exports. Since trails#9015 it no longer loads command modules statically.

Rails' `require "rails"` loads `railties/lib/rails.rb`, which loads no command code.
Commands are reached only through `rails/commands.rb` (`vendor/rails/v8.0.2/railties/lib/rails/commands.rb`).
No existing trailties subpath fills that gap: `./engine` does not export `Trails`, and
`./rails.js` is not in `exports`.

## What the edge costs, measured

Node, on an app from `trails new --dev` booted by each bin, with the harness'
resolve hook:

| process entry                 | modules | commander | `dist/commands/` |
| ----------------------------- | ------- | --------- | ---------------- |
| `trails-server`               | 1260    | 2         | 0                |
| `trails server -e production` | 1261    | 2         | 1                |

The two `commander` modules on the first row are this story: the bin reaches no
CLI code, the app's own `config.ts` does. **On Node that is 2 modules**, and it
should be reported as 2 modules.

Where it is not small is AOT. Perry's collection does not defer a constant
`await import()` — it follows one exactly as it follows a static import
(fixture: a 3-module subtree collects at 4 either way, against 1 for a
runtime-computed specifier). So the lazy `LOAD_PATH` table trails#9015
introduced defers nothing for a native build, and reaching `cli.js` collects
the command tree and the build tooling with it. `perry -v compile`, on an entry
importing each specifier:

| entry specifier                 | collected | vite | rollup | esbuild | dev-server |
| ------------------------------- | --------- | ---- | ------ | ------- | ---------- |
| `@blazetrails/trailties/server` | 1468      | 0    | 0      | 0       | 0          |
| `@blazetrails/trailties`        | 1648      | 11   | 6      | 1       | 1          |

`vite/dist/node/chunks/config.js` is in the second row, and it is the module
behind the `perry_fn_...vite...config_js__createServer$2` link failure that
blocks the native build outright. That is the reason to do this story; the Node
figure is not.

`@blazetrails/trailties/all`, which generated `config/application.ts` also
imports, does **not** reach the CLI — measured at `commander=0`, no `cli.js`
and no `commands/`, against `commander=2` and one `cli.js` for the barrel. So
`"."` is the only edge, and fixing it is sufficient.

## Acceptance criteria

- `"."` resolves to a module mirroring `rails.rb` (the `Trails` / `Application` surface) that
  imports neither commander nor `cli.ts`.
- The `trails` bin still reaches `createProgram` through `command.ts`.
- Generated `config/application.ts` and `config/routes.ts` keep importing from
  `@blazetrails/trailties`.
- Record the module count and time for `import("@blazetrails/trailties")`, before and after,
  measured with the boot-graph harness.
- A generated app booted by `trails-server` has `commander: 0` and no
  `dist/commands/` module in its boot graph.
- `perry -v compile` on a generated app's entry collects **0** `vite`, `rollup`
  and `esbuild` modules, replacing the 11 / 6 / 1 above. This is a Perry
  measurement, not a harness one: the harness counts Node's graph, which defers
  what Perry collects, so neither substitutes for the other.
- `trails new`'s output still boots and serves: `/up` returns 200.

## Definition of done

`import("@blazetrails/trailties")` reaches no CLI module, with the before/after
counts recorded here and the Perry table re-measured to 0 for the build
tooling.

The Node delta alone is **not** an acceptable justification: it is 2 modules.
Both figures must be stated.

Measured under `trails-server`, not under `trails server` — the latter _is_ the
CLI, and loading the CLI there is correct.

## Supersedes

An earlier story, `generated-apps-import-trails-from-the-cli-barrel`, proposed
the opposite fix: leave `"."` alone and repoint the four generated `config/*`
imports at a non-CLI subpath. It was withdrawn in favour of this one and never
merged. This approach wins on three counts, recorded so it is not re-proposed:

- **Rails precedent.** `require "rails"` loads `rails.rb`, which loads no
  command code. Repointing `"."` is what Rails already does; moving call sites
  is not.
- **It fixes every consumer**, not only generated apps. Anything importing
  `@blazetrails/trailties` by bare specifier — a script, a test helper, a Perry
  entry — stops paying for the CLI without being edited.
- **No generator churn.** The call-site approach needed template changes plus
  their expectation fixtures, and a decision about which bindings a new subpath
  must re-export (`Trails` and `Application` at least).

The claim that repointing `"."` is a breaking change does not survive contact:
the bindings generated code imports (`Trails`, `Application`) stay exported,
the `trails` bin reaches the CLI through `command.ts`, and only CLI internals
leave the `"."` surface.
