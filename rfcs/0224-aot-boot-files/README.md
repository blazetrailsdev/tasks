---
rfc: "0224-aot-boot-files"
title: "Files a boot loads by path reach an ahead-of-time build"
status: draft
created: 2026-11-07
updated: 2026-11-07
owner: "@deanmarano"
packages:
  - ruby-compat
  - trailties
  - actionpack
  - "trails-tsc"
clusters: []
---

## Summary

A trails boot loads the application's own files by path:
`import(pathToFileURL(path).href)`. An ahead-of-time compiler can't follow a
runtime URL, so each of those files is missing from a compiled build, and
nothing notices. This RFC routes every such load through one `Kernel#load` /
`Kernel#require` port that checks a map of literal `() => import("./file")`
thunks first. `trails build` writes that map beside the RFC 0213 autoload
maps, and the generated entry installs it. Development and test are unchanged.

## Motivation

The perry native ladder (trails `examples/perry-native`, FINDINGS wall 30)
compiles a trails application to a native binary that boots, listens, and
answers `GET /up` with `404`, where Node answers `200`. The log says
`No route matches [GET] "/up"`. `config/routes.ts` was never compiled in:
`RoutesReloader#loadPaths` loads it by URL, and perry compiles that site to a
deferred runtime error. Boot then finishes with an empty route table.

Routes are one row of nine. Perry lists every site it deferred, and these are
the ones that load application files during a production boot or request:

| Site (trails `main`)                           | Loads                          | Rails                |
| ---------------------------------------------- | ------------------------------ | -------------------- |
| `trailties` `RoutesReloader#loadPaths`         | `config/routes.ts`             | `load`               |
| `actionpack` `Mapper#draw` (`drawRoutes`)      | `config/routes/<name>.ts`      | `instance_eval`      |
| `trailties` `Engine` `load_environment_config` | `config/environments/<env>.ts` | `require`            |
| `trailties` `Engine#loadConfigInitializer`     | `config/initializers/**`       | `load`               |
| `trailties` `Application#configFor`            | `config/<name>.ts`             | YAML read            |
| `trailties` `database`                         | `config/database.ts`           | YAML read            |
| `trailties` action-controller trailtie         | `app/helpers/**`               | `require_dependency` |
| `trailties` `Engine#loadSeed`                  | `db/seeds.ts`                  | `load`               |
| `zeitwerk` `Kernel#require`                    | every autoloaded `app/` file   | `require`            |

The zeitwerk row is handled by trails#9850, which writes and installs the
RFC 0213 maps through a generated entry. This RFC covers the other eight
rows.

What makes this worse than a missing file is that it happens silently. A
binary with no initializers, no environment file and no routes boots
anyway. Rung 07 of the ladder claimed "initializers, autoloading, routes" for
weeks, and it was never true.

## Design

### One load, the way Rails spells it

Almost every row above is a `load` or a `require` in Rails. ruby-compat
already ports both, as `rbFLoad` (`Kernel#load`, `load.c:903`) and
`rbFRequireFile` (`Kernel#require`, `load.c:1236`). Each site calls one of
them instead of writing its own `import(pathToFileURL(...))`:

    await rbFLoad(path)          // config/routes.ts, initializers, seeds
    await rbFRequireFile(path)   // environments, helpers

That brings the call sites back to Rails' shape, which is the main argument
for this RFC on its own. It also leaves one place that decides how a file is
reached.

### A map of compiled files, consulted first

ruby-compat keeps a map from an absolute path to a thunk, filled by
`registerCompiledFiles(root, { "config/routes.ts": () => import(...) })`.
`rbFLoad` and `rbFRequireFile` check it before falling back to `import(url)`. The cache
busting that reload needs (`?load=N`) still goes through `import(url)`: the
map answers a file's first load only, the same rule zeitwerk's `require`
applies to `loader.imports` (`_generation === 1`). A compiled build never
reloads.

`@noRailsEquivalent PERMANENT`, against the root `CLAUDE.md` section RFC 0213
added ("`Module#autoload` is a build step"). The reason is the same: JS has
no synchronous load by path that a static analyzer can see.

### `trails build` writes it

The build step already boots the application up to `setup_main_autoloader`.
It now also lists the boot files it can name statically, using the same path
config the boot reads (`paths["config/routes"]`, `paths["config/initializers"]`,
`paths["config/environments"]`, `paths["db/seeds.ts"]`, helpers' paths, and
every `config/*.ts`). It writes `.trails/boot.generated.js`, which imports
those files as literal thunks and calls `registerCompiledFiles`. The
install module from trails#9850 imports it, so the entry installs both maps.

Engines contribute their own paths the same way, so an engine's routes and
initializers are covered too.

## Non-goals

- **Views.** `actionview` `Template` imports a compiled `.trails/views/*.js`
  per template. RFC 0140 (trails#7649) chose to render `.tse` source at
  request time and gave the AOT views manifest no runtime consumer. A
  compiled build that renders a template has to revisit that ruling. It does
  not block `/up`, and it gets its own RFC.
- **Detecting a missing file at runtime.** trails can't tell that a compiled
  build left a file out: the failure happens at the deferred import, inside
  the compiler's output. Perry should make a deferred import that a program
  actually reaches fail loudly. That gets filed against perry.
- **Changing how development boots.** With no map installed, every site
  behaves exactly as it does today.

## Alternatives considered

- **Import `config/routes.ts` statically in the application or the rung.**
  This reaches `200` for `/up` and leaves seven rows missing and silent. It
  also draws routes twice once the real fix lands.
- **Teach the compiler to resolve `import(pathToFileURL(x).href)`.** `x` is
  computed from runtime path config and directory listings, so it can't be
  known statically in general.
- **A bespoke map per site** (`RoutesReloader.compiledPaths`, ...): eight
  registries, eight build writers, and each site keeps its non-Rails
  `import()` spelling.
- **`import.meta.glob`.** It's Vite-only, and neither Node nor perry
  implements it.

## Stories

| Slug                                           | Est | Deps                   |
| ---------------------------------------------- | --- | ---------------------- |
| `ruby-compat-load-consults-compiled-files`     | 150 | —                      |
| `boot-sites-load-through-kernel-load`          | 220 | the above              |
| `trails-build-writes-the-boot-file-map`        | 160 | the above, trails#9850 |
| `perry-native-rung-08-boots-through-the-entry` | 40  | the above              |

The last one switches `examples/perry-native`'s rungs to import
`.trails/entry.generated.js`. Success means `[08] env=production status=200
len=73` from the compiled binary.

## Open questions

- Should `configFor` and `config/database.ts` go through `rbFLoad`? In Rails
  they're YAML reads, not loads. The alternative is a `readConfig` beside
  `rbFLoad` that uses the same map.
- Should the build list `config/*.ts` wholesale, or only the names a boot
  actually asks `configFor` for?

## Changelog

- 2026-11-07: drafted from perry native ladder wall 30.
