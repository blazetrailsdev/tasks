---
rfc: "0151-activesupport-autoload-slot-registry"
title: "Converge zero-import slots onto ActiveSupport::Autoload"
status: closed
created: 2026-09-15
updated: 2026-09-26
owner: "@deanmarano"
packages:
  - activesupport
  - activerecord
  - activemodel
  - actionpack
  - actionview
  - arel
  - rack-session
  - trailties
clusters:
  - autoload
  - load-order-cycles
priority: 4
---

# RFC 0151 — Converge zero-import slots onto ActiveSupport::Autoload

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
  25 non-test `*slot*` modules (24 slots plus `support/ar-db-slots.ts`, the test-DB
  pool sizer, which is not a slot) across activerecord, activemodel, activesupport,
  actionpack, actionview, arel, rack-session and trailties. Each has a bespoke setter name and none
  has a Rails counterpart.
- **The register has drifted.** CLAUDE.md says "Fifteen instances exist and are the
  only ones", but slots such as `load-schema-overrides-slot.ts`,
  `relation/uncacheable-methods-slot.ts`,
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
  synchronous read; top-level await also breaks the IIFE/CJS bundles (they fail the Website build).
- **Map slots to `Rails.autoloaders`.** Wrong layer: Zeitwerk is the application
  loader, and trails has none.

## Rollout

1. **Phase 1 — registry:** `port-activesupport-dependencies-autoload`.
2. **Phase 2 — hot path, decides Open question 1:** `converge-arel-node-slots-onto-autoload`.
3. **Phase 3 — per package, in parallel after Phase 2:**
   - `converge-activerecord-association-slots-onto-autoload`
   - `converge-activerecord-core-slots-onto-autoload`
   - `converge-activerecord-support-db-slots`
   - `converge-activemodel-and-actionview-slots-onto-autoload`
   - `converge-activesupport-slots-onto-autoload`
   - `converge-actionpack-rack-session-trailties-slots-onto-autoload`

   Slots that stand in for a Rails `on_load` hook or a cross-package `defined?` rather than a cycle are classified there and ported onto `onLoad` instead.

4. **Phase 4 — docs:** `rewrite-call-time-constant-resolution-onto-autoload`.

## Verification

- Zero `*-slot.ts` / `*-slots.ts` non-test modules remain under `packages/*/src`,
  excluding `packages/activerecord/src/support/ar-db-slots.ts`: its "slots" are the
  test-DB pool (`AR_DB_SLOTS`, `slotPoolSize`), it holds no call-time binding or
  setter, and it breaks no cycle (`converge-activerecord-support-db-slots`).
- `parity:api:extra:gate` `total` drops by the removed setters; no new rows.
- For each migrated cycle, a plain-node import of the built `dist` entry module does
  not throw TDZ, in both directions (the check CLAUDE.md already requires).
- Arel node construction benchmark: no regression beyond an agreed bound versus
  `_Not!` direct reads (the bound is set in Phase 2).

## Open questions

1. **Registry lookup cost on Arel's hot path.** Options: a map lookup per read; or
   `autoload` also exporting a live binding the reader imports, which is the slot's
   speed with Rails' registration API. **Resolved (trails#7988): a property read
   on the `Autoload`-extended namespace object** — `new Nodes.Not(this)`, through
   the accessor `autoload` installs, with no second live-binding export. The
   committed `packages/arel/src/nodes/node.bench.ts` measured no regression versus
   the slot's `_Not!` read (Node#not/#or/#and 1.45M → 1.50–1.70M hz;
   Predications#eq 5.3–5.5M → 6.1M hz). Phase 3 copies this shape; the namespace
   objects live in a zero-cycle module (`packages/arel/src/namespaces.ts`), and the
   defining module seats each constant (`Nodes.Not = Not`).
2. **Where does `autoload` register when Ruby's receiver is a module with no TS
   object** (e.g. `Arel::Nodes`)? Recommendation: the namespace objects trails already
   exports, falling back to a registry keyed by the Ruby constant path.
3. **Does `eagerLoadBang` stay async?** Rails' is sync `const_get`; an async import
   walk changes its signature. Recommendation: async, cited under CLAUDE.md
   § "Relation is evaluated by an async query"'s no-synchronous-await rationale.

## Changelog

- 2026-09-15: initial draft.
- 2026-09-22: Open question 1 resolved by trails#7988 (property read on the namespace object).
- 2026-09-23: `support/ar-db-slots.ts` recorded as test tooling, not a slot; excluded from the Verification glob.
