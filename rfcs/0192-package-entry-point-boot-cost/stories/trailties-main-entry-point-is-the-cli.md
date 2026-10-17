---
title: "trailties: the `.` entry point is the CLI, so every app boot loads 18 commands, commander and vite"
status: draft
updated: 2026-10-17
rfc: "0192-package-entry-point-boot-cost"
cluster: "findings"
packages: ["trailties"]
deps: ["boot-graph-measurement-harness"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/trailties/package.json` maps the main entry point straight at the
CLI:

```json
"." : "./dist/cli.js"
```

and `src/cli.ts` re-exports the one binding an application actually wants
alongside eighteen static command imports:

```ts
import { Command } from "commander";
import { newCommand } from "./commands/new.js";
// … 17 more command imports …
export { Trails } from "./rails.js"; // cli.ts:20
```

`trails new` writes `import { Trails } from "@blazetrails/trailties"` into
`config.ts`, so **every production boot of every trails app loads the entire
CLI surface**. ESM `import` is eager, so none of it is deferred.

Measured on the scaffolded app in `examples/perry-native`, Node 24:

| Entry                           | Modules | Time   |
| ------------------------------- | ------- | ------ |
| `@blazetrails/trailties`        | 1207    | 4172ms |
| `@blazetrails/trailties/engine` | 777     | 2180ms |

The 431 modules that only the `.` entry pulls in:

| Package                          | Modules |
| -------------------------------- | ------- |
| `@blazetrails/activerecord`      | 231     |
| `@blazetrails/trailties`         | 99      |
| `@blazetrails/arel`              | 84      |
| vite, rollup, commander, esbuild | 12      |
| activesupport, globalid, app     | 5       |

**The 2.0s figure is not the available win, and this story should not claim it
is.** 315 of those modules are activerecord + arel, reached through the `db`
and `dbconsole` commands — and any app with a model loads activerecord anyway
(`app/models/application-record.ts` imports `Base` from it directly). The
attributable saving is trailties' own 99 command modules plus the 12
build-tool modules, and those 12 matter out of proportion to their count:
`vite`, `rollup` and `esbuild` are devDependencies with no business in a
production process image.

vite arrives through one static import in shipped `dist`:

```text
dist/server/dev-server.js:2:  import { createServer } from "vite";
```

reached as `cli.js` → `commands/server.js` → `server/dev-server.js`. It is six
module _files_ at Node boot because vite ships pre-bundled, so its Node cost is
parse weight (megabytes) rather than module count.

**Where it is not merely weight:** compiling the same app AOT with Perry, vite
in the graph is a hard failure, not a tax — the link aborts on an undefined
`perry_fn_…vite…config_js__createServer$2`. Native compilation cannot drop a
devDependency the module graph statically requires.

There is no existing subpath that solves this: `./engine` does not export
`Trails`, and `./rails.js` is not in the `exports` map. A narrow entry has to be
added.

## Acceptance criteria

- [ ] An `exports` subpath exists that provides `Trails` without reaching
      `commands/` — and `trails new`'s generated `config.ts` uses it
- [ ] The `.` entry keeps working unchanged, so the CLI and existing apps are
      not broken
- [ ] `commander`, `vite`, `rollup` and `esbuild` are absent from the generated
      app's boot graph, measured with the harness
- [ ] The before/after module counts are recorded in this story

## Definition of done

The generated app's boot graph contains no build tooling, and the measured
module count for the new entry is recorded next to the 1207 above. Reporting
the full 431-module delta as the win is **not** acceptable — the activerecord
and arel share must be stated as loaded-anyway.

Deliberately out of scope: whether `cli.ts` should import its eighteen commands
lazily. That helps `trails <command>` startup, is a larger change, and is not
needed for an application boot that never reaches the CLI at all.
