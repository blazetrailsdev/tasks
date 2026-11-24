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

### A compiled tree boots on its own; the build entry is an optimisation

Stories 1 and 2 alone must make a tsc `dist/` bootable, with no `trails build`
output at all. The runtime autoloader then globs `dist/app/**/*.js` as it
globs `app/**/*.ts` from source (its glob already takes `{ts,js}`). The build
entry is a second step that removes that glob and the by-path loads.

### Long-running commands boot from the build entry, in a compiled root only

`trails server`, `bin/jobs` (solid-queue's `Cli`) and `db:prepare` boot the
application the way the Lambda handler does, by importing
`<root>/.trails/entry.generated.js`, but only when **the root is a compiled
root**: the root the marker lookup found holds `config.js` and no
`config.ts`. A source tree never qualifies. A developer who ran `trails build`
locally, or a stale `.trails/` beside the source, still boots through
`config/environment` and the autoloader, so development is unchanged.

`trails build` is run from inside the compiled tree (`cd dist && trails
build`). It already accepts `config/application.{ts,js}`, and globs its
autoload paths with their `{ts,js}` extensions, so from `dist/` it writes
`dist/.trails/`, whose imports name `.js` modules. Its `registerCompiledFiles`
keys are root-relative paths of the files it found, which are `.js` there. The
resolution helper from story 1 has to treat a `.ts` lookup as answered by the
`.js` key, so a site asking for `config/routes.ts` finds the `config/routes.js`
entry. Story 3 proves all of this against a real `dist/`, not by reading the
code.

### `trails new` produces a compiled image

The generated `bin/trails` resolves `config/application.{ts,js}`. The
generated `build` script emits, the Dockerfile runs it and then `trails build`
inside `dist/`, and `CMD` runs the compiled server under `node`. `tsx` and
`typescript` stay devDependencies, and the runtime stage installs production
dependencies only.

## Non-goals

- Development and test, which keep running source.
- trailmap's own switch, which lands in trailmap after a re-vendor.
  trailmap#198 already builds `dist/` in its image for that reason.

## Alternatives considered

- **A Node `--import` resolve hook that maps `.ts` to `.js`.** It is the
  smallest change, but every app has to pass the flag to every process
  (server, worker, release, console). It also leaves the framework naming
  files that don't exist, which is the defect, so the next site to hardcode
  `.ts` works under the hook and breaks without it. Rejected.
- **Ship source and rely on Node's native type stripping instead of `tsx`.**
  Node 26 strips erasable syntax, and trailmap already sets
  `erasableSyntaxOnly`. This removes `tsx` but still runs source rather than
  what `tsc` checked and emitted, and it still needs every `.ts` path to
  exist. It doesn't remove the `typescript` question either, because the
  views compile in a build step anyway. Deferred, as open question 1.
- **Bundle the server with esbuild or Rollup**, as the Lambda example does.
  A bundle needs the same root and rackup fixes (the Lambda zip ships
  `config.ts` only because `findRoot` needs it), and it adds native-addon and
  dynamic-import handling (`better-sqlite3`, `libxml2-wasm`'s split chunk).
  A tsc `dist/` is the smaller step. Bundling stays possible on top of it.

## Rollout

1. Phase 1, a compiled tree boots:
   `root-marker-and-rackup-resolve-compiled-config`,
   `named-boot-loads-resolve-ts-then-js`.
2. Phase 2, a compiled root boots from its build entry:
   `long-running-commands-boot-from-the-build-entry`.
3. Phase 3, new apps ship compiled:
   `generated-app-ships-compiled`, `generated-app-boots-compiled-without-tsx`.

Existing generated apps migrate with `trails app:update`, which already
regenerates `bin/trails` and the Dockerfile from the templates. Story 4 lists
the resulting diff in its PR as the upgrade note. trailmap, which is not
generated, migrates by hand after the re-vendor.

## Verification

- `generated-app-boots-compiled-without-tsx` is green in CI: `db:prepare`,
  `server` (`/up` 200, one page rendered) and `jobs` (one job performed),
  from `dist/`, with neither `tsx` nor `typescript` resolvable.
- 0 string literals ending in `.ts` on the boot path of the built
  trailties, actionpack and activerecord packages, outside generators and
  outside listed exceptions. The audit is in story 2.
- trailmap's image after its switch contains no `tsx` and no `typescript`,
  and its `CMD` is `node`.

## Open questions

1. **Should "source plus native type stripping" be a supported mode too?**
   Recommendation: no, and deferred to a follow-up RFC if someone asks. This
   RFC's fixes are what such a mode would need anyway, except that it would
   also need the `.ts` names to keep resolving.

## Changelog

- 2026-11-23: initial RFC, from trailmap#198.
- 2026-11-23: review. Template sections, build-entry trigger limited to a
  compiled root, where the entry lives and what it imports, and the RFC 0142
  story closed as superseded.

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
before this RFC existed, is closed as superseded by the first two stories.
