---
title: "trailties: production `trails server` loads all 18 CLI commands and vite, because the dev-server import is static"
status: draft
updated: 2026-10-17
rfc: "0192-package-entry-point-boot-cost"
cluster: "findings"
packages: ["trailties"]
deps: ["boot-graph-measurement-harness"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A trails app runs in production **through the CLI**. trailmap's `Procfile` and
`Dockerfile` both say so:

```text
web: node_modules/.bin/tsx node_modules/@blazetrails/trailties/bin/trails.js server -b 0.0.0.0 -p 8080
```

So `config.ts` is not the process entry — it is loaded _by_ the `server`
command. That makes loading CLI code inherent to the deployment shape, not an
accident, and this story does **not** claim otherwise.

What is still wrong is what the `server` command drags in. The chain:

- `bin/trails.js` → `dist/bin.js` → `invoke()` from `command.js`
- `command.ts:42` — `const { createProgram } = await import("./cli.js")`
- `cli.ts` — eighteen **static** command imports plus `commander`
- `commands/server.ts:8` — `import { DevServer } from "../server/dev-server.js"`
- `server/dev-server.ts:2` — `import { createServer } from "vite"`

`invoke`'s `await import` is dynamic, but it runs at startup, so nothing is
saved by it. Every static import below it is eager.

The sharpest part is `commands/server.ts`, where the _use_ of `DevServer` is
already guarded to development:

```ts
if (options.environment !== "development" || !(await hasViteConfig(root))) {
```

A runtime guard cannot undo an eager import. **Production loads vite even
though production can never construct a `DevServer`.**

Measured on the scaffolded app in `examples/perry-native`, Node 24:

| Specifier                       | Modules | Time   |
| ------------------------------- | ------- | ------ |
| `@blazetrails/trailties`        | 1207    | 4172ms |
| `@blazetrails/trailties/engine` | 777     | 2180ms |
| `vite`                          | —       | 252ms  |
| `@blazetrails/trailties/vite`   | —       | 420ms  |

`@blazetrails/trailties` is `./dist/cli.js`, which is what `invoke` loads, so
the 1207 is the production figure. Of the 431 modules the `.` entry adds over
`./engine`, 231 are activerecord and 84 arel — reached through the `db` and
`dbconsole` commands. **Those are not a saving:** any app with a model loads
activerecord anyway (`app/models/application-record.ts` imports `Base` from it
directly). The build tooling is: vite, rollup, commander, esbuild.

vite is six module _files_ because it ships pre-bundled, so its cost is parse
weight — ~250ms of a production boot, and ~420ms with the plugin — not module
count.

**Where it is not merely weight:** compiling the same app AOT with Perry, vite
in the graph is a hard link failure on an undefined
`perry_fn_…vite…config_js__createServer$2`. Native compilation cannot drop a
devDependency the module graph statically requires, so this blocks the native
build outright rather than taxing it.

## Acceptance criteria

- [ ] `commands/server.ts` reaches `DevServer` through a dynamic `import()`
      inside the development branch, not a module-level import
- [ ] `vite`, `rollup` and `esbuild` are absent from the boot graph of
      `trails server -e production`, measured with the harness
- [ ] `trails server` in development still starts the vite dev server, with a
      test covering it
- [ ] The before/after production boot module count and time are recorded here

## Definition of done

A production `trails server` boot graph with no build tooling in it, and the
numbers recorded next to the 1207/4172ms above.

Reporting the 431-module delta as the win is **not** acceptable: the
activerecord and arel share must be stated as loaded-anyway.

## Deliberately out of scope

- **`cli.ts`'s eighteen static command imports.** Making those lazy would cut
  more than the dev-server fix does, but it is a larger change to command
  registration (`createProgram` builds the whole `commander` tree), and it
  wants its own story.
- **The `"." -> ./dist/cli.js` mapping.** It is a second, independent path to
  the same cost — `import { Trails } from "@blazetrails/trailties"` in a
  generated `config.ts` resolves to the CLI — which matters for any entry that
  is not the CLI, including a Perry AOT binary. No existing subpath fixes it
  (`./engine` does not export `Trails`; `./rails.js` is not in `exports`), so
  it needs a new entry point and its own story.
