---
title: "`trails new` points every generated config file at the CLI barrel, so an app boot loads the CLI even when its process entry does not"
status: draft
updated: 2026-10-17
rfc: "0192-package-entry-point-boot-cost"
cluster: "findings"
packages: ["trailties"]
deps: ["trailties-main-entry-point-is-the-cli"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`@blazetrails/trailties`'s `"."` export is `./dist/cli.js`. Every file
`trails new` generates that needs a framework binding imports it from there:

```text
config.ts:2                 import { Trails } from "@blazetrails/trailties";
config/environment.ts:1     import { Trails } from "@blazetrails/trailties";
config/routes.ts:1          import { Trails } from "@blazetrails/trailties";
config/application.ts:1     import { Application } from "@blazetrails/trailties";
```

So the CLI module is in the graph of every boot of every generated app — a
server, a test process, a one-off script — whatever the process entry is.

This was previously recorded as out of scope on
[trailties-main-entry-point-is-the-cli], on the grounds that production boots
through the CLI anyway so the mapping cost nothing extra. Two changes since
make it the remaining cost rather than a theoretical one:

- trails#9015 made command lookup lazy and the dev-server import dynamic, so
  reaching `dist/cli.js` no longer drags in eighteen commands or `vite`. What
  is left is `commander` — and the fact that the CLI is still the entry.
- A `trails-server` bin and a `@blazetrails/trailties/server` subpath now exist
  (same dep), giving a process entry that reaches no CLI code at all. The
  generated app is what still does.

Measured on an app from `trails new --dev`, booted by each bin, Node 24, with a
resolve-hook module counter:

| process entry                 | modules | commander | `trailties/dist/commands/` |
| ----------------------------- | ------- | --------- | -------------------------- |
| `trails-server`               | 1260    | 2         | 0                          |
| `trails server -e production` | 1261    | 2         | 1                          |

**The `commander: 2` on the first row is this story.** The bin itself reaches
no CLI code; the app's own `config.ts` does. On Node that is 2 modules — small,
and it should be reported as small.

**Where it is not small:** Perry's AOT collection does not defer a constant
`await import()` — it follows one exactly as it follows a static import
(measured: a 3-module subtree collects at 4 modules either way, against 1 for a
runtime-computed specifier). So for a native build the lazy `LOAD_PATH` table
`trails#9015` introduced defers nothing, and reaching `dist/cli.js` collects
the command tree and `vite` with it. Measured with `perry -v compile` on an
entry importing each specifier:

| entry specifier                 | collected | vite | rollup | esbuild | dev-server |
| ------------------------------- | --------- | ---- | ------ | ------- | ---------- |
| `@blazetrails/trailties/server` | 1468      | 0    | 0      | 0       | 0          |
| `@blazetrails/trailties`        | 1648      | 11   | 6      | 1       | 1          |

`vite/dist/node/chunks/config.js` is in the second row and is the module behind
the `perry_fn_…vite…config_js__createServer$2` link failure that blocks the
native build. A generated app that imports from the barrel puts it back in the
graph however the process is started.

## Problem

`@blazetrails/trailties/server` exports `serve` and `Trails`. The generated
files need `Trails` **and `Application`**, so the templates cannot simply be
repointed — the entry's surface has to be settled first. That is the decision
this story carries, not just a find-and-replace.

## Acceptance criteria

- [ ] A non-CLI entry point exports every binding `trails new`'s templates
      need — at least `Trails` and `Application` — with the choice of which
      entry (the existing `./server`, or a new one) recorded here with its
      reasoning
- [ ] The generated `config.ts`, `config/environment.ts`, `config/routes.ts`
      and `config/application.ts` import from it, not from `"."`
- [ ] A generated app booted by `trails-server` has `commander: 0` and no
      `trailties/dist/commands/` module in its boot graph, measured with the
      harness
- [ ] `trails new`'s own output still boots and serves: `/up` returns 200
- [ ] Generator expectation fixtures updated in the same change
- [ ] `trails server` is unaffected — it is the CLI, and loading the CLI is
      correct there

## Definition of done

A generated app whose boot graph contains no CLI module under either bin, with
the before/after counts recorded next to the 1260/2 above.

Reporting the Node module delta as the justification is **not** acceptable: it
is 2 modules. The reason to do this is that it is the last edge from a
generated app to the CLI, and that AOT collection pays for that edge in full —
both figures must be stated.

## Deliberately out of scope

- **Changing what `"."` resolves to.** Repointing it away from `dist/cli.js`
  would be a breaking change for anything importing the package by bare
  specifier, and the `trails` bin is a legitimate consumer of the CLI. This
  story moves the generated call sites; it does not relitigate the mapping.
- **`@blazetrails/trailties/all`.** `config/application.ts` also imports it,
  deliberately — it is the trailtie loader, not the CLI. Its own cost belongs
  with the barrel stories.
- **Perry's remaining link failures.** `I18n$info` and the `db.js`
  `establishConnection` symbol are separate and not caused by this edge.
