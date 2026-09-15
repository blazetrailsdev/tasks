---
rfc: "0000-activesupport-autoload-slot-registry"
title: "Converge zero-import slots onto ActiveSupport::Autoload"
status: draft
created: 2026-09-15
updated: 2026-09-15
owner: "@deanmarano"
packages:
  - activesupport
  - activerecord
  - activemodel
  - actionview
  - arel
  - rack-session
  - trailties
clusters:
  - autoload
  - load-order-cycles
---

<!-- Unnumbered until merge; scripts/finalize-rfc.mjs assigns the number. -->

# RFC — Converge zero-import slots onto ActiveSupport::Autoload

## Summary

The Rails gems break their own load-order cycles with `ActiveSupport::Autoload`
(`activesupport/lib/active_support/dependencies/autoload.rb`), a thin layer over
`Module#autoload`: `active_record.rb:41-43` does `extend ActiveSupport::Autoload;
autoload :Base`, groups constants under `eager_autoload do … end` (`:95`, `:136`),
and loads them with `eager_load!`. trails solves the same problem with hand-written
**zero-import slot modules** (CLAUDE.md § "Call-time constant resolution"): one file
per cycle, each exporting a mutable binding plus a `_setX()` setter. This RFC
converges the slots onto a ported `ActiveSupport::Autoload` surface, so the mechanism
has Rails' names and lives in one place.

This is about framework-internal constant resolution only. Application autoloading
(`Rails.autoloaders` / Zeitwerk) is ratified as absent in CLAUDE.md § "Trails has no
autoloader", and this RFC does not reopen that.

## Motivation

- **Invented surface, repeated.** `git ls-files 'packages/*/src/**/*slot*.ts'` lists
  about 24 non-test slot modules across activerecord, activemodel, activesupport,
  actionview, arel, rack-session and trailties. Each has a bespoke setter name and none
  has a Rails counterpart.
- **The register has drifted.** CLAUDE.md says "Fifteen instances exist and are the
  only ones", but slots such as `load-schema-overrides-slot.ts`,
  `relation/uncacheable-methods-slot.ts`, `support/ar-db-slots.ts`,
  `activesupport/src/trails-logger-slot.ts`, `broadcast-logger-slot.ts` and
  `cache/format-version-slot.ts` are not listed. A per-file register cannot be kept
  current by hand.
- **Rails already has the shape.** `autoload :Base` binds a name now and resolves it
  at first read, which is exactly the job a slot does. `eager_autoload` /
  `eager_load!` is what `ActiveRecord.eagerLoadBang` (`active-record.ts:412`) already
  approximates by hand.

## Design

1. **Port `ActiveSupport::Autoload`** in `packages/activesupport/src/dependencies/autoload.ts`:
   - `autoload(constName, path?)`, `autoloadUnder`, `autoloadAt`, `eagerAutoload`, `eagerLoadBang`, at their Rails names and in source order.
   - The registry module has **zero runtime imports**, so it cannot join a cycle. That is the property that makes slots work today.
2. **Binding replaces `Module#autoload`'s lazy load.** A defining module registers its
   constant at the bottom of its body (as `_setX()` does now). A reader resolves the
   name from its namespace at call time. `eagerLoadBang` imports every
   `eagerAutoload`-registered module (async `import()`), which is where Rails' `const_get`
   loads.
3. **Unguarded read.** An unresolved constant surfaces as the JS analogue of
   `NameError`, keeping the current "a slot read carries no guard" rule.
4. **Typed namespaces.** Each namespace (`ActiveRecord`, `Arel::Nodes`, …) declares a
   name → type map, so reads are typed without a cast per call site.
5. **Migrate per package, one PR each,** deleting the slot files and their setters, and
   rewrite CLAUDE.md § "Call-time constant resolution" to describe the Rails-named
   mechanism instead of an instance list.

## Alternatives considered

- **Keep the slots and just fix the CLAUDE.md register.** Cheapest, but leaves N
  invented setter names and a register that drifts again.
- **Real lazy loading via top-level `await import()` on first read.** Impossible for a
  synchronous read; top-level await also breaks the IIFE/CJS bundles (see memory on
  the Website build).
- **Map slots to `Rails.autoloaders`.** Wrong layer: Zeitwerk is the application
  loader, and trails has none.

## Rollout

1. **Phase 1:** port `ActiveSupport::Autoload` with direct tests mirroring
   `activesupport/test/dependencies/autoload_test.rb` (if vendored) and a cycle-safety
   test importing the built `dist/**.js` as an entry module.
2. **Phase 2:** migrate `arel/src/node-slots.ts`. It is the hottest read path, so it
   decides the performance question first.
3. **Phase 3:** migrate the activerecord slots, then activemodel, actionview,
   activesupport, rack-session and trailties, one package per story.
4. **Phase 4:** rewrite the CLAUDE.md section and delete the instance list.

## Verification

- Zero `*-slot.ts` / `*-slots.ts` non-test modules remain under `packages/*/src`.
- `parity:api:extra:gate` `total` drops by the removed setters; no new rows.
- For each migrated cycle, a plain-node import of the built `dist` entry module does
  not throw TDZ, in both directions (the check CLAUDE.md already requires).
- Arel node construction benchmark: no regression beyond an agreed bound versus
  `_Not!` direct reads (the bound is set in Phase 2).

## Open questions

1. **Registry lookup cost on Arel's hot path.** Options: a map lookup per read; or
   `autoload` also exporting a live binding the reader imports, which is the slot's
   speed with Rails' registration API. Recommendation: decide in Phase 2 with a
   benchmark.
2. **Where does `autoload` register when Ruby's receiver is a module with no TS
   object** (e.g. `Arel::Nodes`)? Recommendation: the namespace objects trails already
   exports, falling back to a registry keyed by the Ruby constant path.
3. **Does `eagerLoadBang` stay async?** Rails' is sync `const_get`; an async import
   walk changes its signature. Recommendation: async, cited under CLAUDE.md
   § "Relation is evaluated by an async query"'s no-synchronous-await rationale.

## Changelog

- 2026-09-15: initial draft.
