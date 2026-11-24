---
rfc: "0258-ship-compiled-javascript"
title: "A trails application ships and runs as compiled JavaScript, with no TypeScript at run time"
status: draft
created: 2026-11-23
updated: 2026-11-23
owner: "@deanmarano"
packages:
  - "trailties"
  - "actionpack"
  - "activerecord"
  - "trails-tsc"
  - "solid-queue"
clusters: []
---

# RFC 0258 — ship compiled JavaScript

## Summary

A trails application in production should run the JavaScript its build
emits, under plain `node`, with `tsx` and `typescript` absent from the image.
Today it cannot: the boot finds the application, its rackup file and several
files it loads by name through hardcoded `.ts` filenames, so every production
deploy, the generated app's included (`CMD ["npx", "rackup", "config.ts"]`),
runs its source through a TypeScript loader. This RFC makes those lookups find
a file by its basename, `.ts` then `.js`, makes the long-running commands
(`server`, `jobs`, `db:prepare`) boot from the `trails build` entry when there
is one, and makes `trails new` produce an app whose image runs compiled
output.

## Motivation

trailmap, the first application built on trails, tried it
(trailmap#198). `tsc` emits a complete `dist/` (`rewriteRelativeImportExtensions`
rewrites every relative import), and the views compile into it. Booting it:

    $ node --no-experimental-strip-types dist/bin/trails.js server
    configuration config.ts not found

`Application.findRoot` (`trailties/lib/application.ts`) accepts only
`config.ts` as the root marker. With a marker in place, `commands/server`
imports its `--config` default, `config.ts`, and node refuses the extension.

The pieces for a compiled app mostly exist already:

- RFC 0224 routes the boot's by-path loads through `rbFLoad` /
  `rbFRequireFile` and a `registerCompiledFiles` map, and `trails build`
  writes `.trails/entry.generated.js`.
- `examples/serverless-lambda` bundles an app with esbuild and boots it from
  that entry (#10314); `bundle-vite.mjs` does the same through Rollup (#10381).
- The migration loader already globs `[0-9]*_*.{ts,js}`.

What is missing is the ordinary case: a long-running Node server and its
worker and release task. The Lambda example sidesteps it with its own handler
and still ships `config.ts`, because `findRoot` needs it. Rails has no such
split. `config.ru` and every file `require`d by name are found however they
were produced, and nothing at run time compiles them.

Running source through a loader at run time costs boot time and image size
(`tsx` and `typescript` are in every image), and it means the code that runs
is not the code `tsc` checked and emitted.

## Design

### Find a file by its basename

Each site that names an application file with `.ts` resolves the basename,
trying `.ts` and then `.js`, the way `Application` already does for the config
lookup at `application.ts` (`for (const e of [".ts", ".js"])`). One helper owns
the rule so the sites cannot drift. The sites, on trails `main`:

| Site                                             | Names                                         |
| ------------------------------------------------ | --------------------------------------------- |
| `trailties` `Application.findRoot`               | `config.ts` (root marker)                     |
| `trailties` `commands/server` `--config` default | `config.ts` (rackup file)                     |
| `trailties` `command/actions`                    | `config.ts`                                   |
| `trailties` `application/configuration`          | `config/database.ts`, `config/environment.ts` |
| `trailties` `engine`, `engine/configuration`     | `config/routes.ts`, `db/seeds.ts`             |
| `trailties` `server/main`                        | `application.ts`                              |
| `trailties` `trailties/active-record`            | `${path}/schema.ts`                           |
| `actionpack` `Mapper#draw`                       | `${path}/${name}.ts`                          |

A file found through a `registerCompiledFiles` map (RFC 0224) keeps its
`.ts` key. Resolution runs only when there is no map entry.

### Long-running commands boot from the build entry

`trails server`, `bin/jobs` (solid-queue's `Cli`) and `db:prepare` boot the
application the way the Lambda handler does: if `.trails/entry.generated.js`
exists beside the application, they import it instead of loading
`config/environment` through the autoloader. Without it, they fall back to
today's path, so development is unchanged.

### `trails new` produces a compiled image

The generated `bin/trails` resolves `config/application.{ts,js}`. The
generated `build` script emits, the Dockerfile runs it together with
`trails build`, and `CMD` runs the compiled server under `node`. `tsx` and
`typescript` stay devDependencies, and the runtime stage installs production
dependencies only.

## Testing

One end-to-end test is the acceptance bar for the whole RFC: generate an
app, build it, install production dependencies only (so no `tsx` and no
`typescript`), and run `node --no-experimental-strip-types` for `db:prepare`,
`server` (`GET /up` and a rendered page) and `jobs` (one job enqueued and
performed). Each story also brings unit tests for the sites it changes.

## Out of scope

- Bundling (esbuild/Rollup) for a server. A tsc `dist/` tree is enough. The
  bundlers already have examples.
- Development and test, which keep running source.
- trailmap's own switch, which lands in trailmap after a re-vendor.
  trailmap#198 already builds `dist/` in its image for that reason.

## Stories

- `root-marker-and-rackup-resolve-compiled-config` — `findRoot`, the server's
  `--config` default and `command/actions` accept `config.js`.
- `named-boot-loads-resolve-ts-then-js` — the remaining sites in the table,
  through one helper.
- `long-running-commands-boot-from-the-build-entry` — `server`, `jobs`,
  `db:prepare`.
- `generated-app-ships-compiled` — `trails new` templates.
- `generated-app-boots-compiled-without-tsx` — the end-to-end test above.

`compiled-app-cannot-boot-without-tsx` (RFC 0142), filed from trailmap#198
before this RFC existed, is superseded by the first two stories. Close it,
pointing here, once this RFC merges.
