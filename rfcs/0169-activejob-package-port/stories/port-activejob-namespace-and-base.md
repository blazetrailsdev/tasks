---
title: "Port active_job.rb (the ActiveJob namespace with its Autoload seats) and base.rb"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob"]
deps: ["enroll-activejob-in-compare-tooling"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activejob/lib/active_job.rb:34-59` defines the `ActiveJob` module: `extend ActiveSupport::Autoload`
(`:35`), `autoload` for `Base`, `QueueAdapters`, `Arguments`,
`DeserializationError` / `SerializationError` (both from `"active_job/arguments"`),
`EnqueueAfterTransactionCommit`, an `eager_autoload` block for `Serializers` and
`ConfiguredJob`, then `TestCase` and `TestHelper` (`:37-50`), and
`singleton_class.attr_accessor :verbose_enqueue_logs` defaulting to `false`
(`:57-58`).

`vendor/rails/v8.0.2/activejob/lib/active_job/base.rb:63-78` is `class Base` with twelve `include`s (`:64-75`) and
`ActiveSupport.run_load_hooks(:active_job, self)` (`:77`).

Build the namespace as `src/namespaces.ts` in the shape of
`arel/src/namespaces.ts` and `activerecord/src/namespaces.ts` (CLAUDE.md
§ "Call-time constant resolution"). Each constant is seated by its defining
module, and `ActiveJob` registers itself with `registerConstant("ActiveJob", …)`
as `activerecord/src/namespaces.ts:175` does, so `constantize` can walk
`ActiveJob::Serializers::SymbolSerializer`. `QueueAdapters` and `Serializers`
are namespace objects extended with `Autoload` too (`queue_adapters.rb:113`,
`serializers.rb:9`); each owning story seats its members.

`Base` includes the modules as their stories land, each story adding its own
`include` line in `base.rb:64-75` order. This story lands `Base` with
`run_load_hooks` only.

## Fidelity traps (predicted at authoring)

- [ ] `autoload` with an explicit path (`:40-41`, both error classes from `active_job/arguments`) seats a constant defined in another file; the seat is filled by `arguments.ts`, not by a file named after the constant.
- [ ] `verbose_enqueue_logs` is a singleton accessor on the module with a stored default of `false`, not a `class_attribute`; the railtie writes it through `ActiveJob.respond_to?("verbose_enqueue_logs=")` (`railtie.rb:62`), so the setter must be answerable by `rbObjRespondTo`.
- [ ] `eager_autoload` membership is observable through `ActiveJob.eager_load!`; port the grouping, not a flat list.

## Acceptance criteria

- [ ] `active_job.rb` and `base.rb` read complete in `parity:api` except the `include` lines later stories add.
- [ ] `onLoad("activeJob", …)` fires once, with `Base` as its argument, when `base.ts` loads.
- [ ] `constantize("ActiveJob")` resolves the namespace.
- [ ] Plain-node imports of the built `dist/base.js` and `dist/namespaces.js`, each as the entry module, succeed (no TDZ).

## Definition of done

A `globalThis` seat, or a `Base` that includes modules this story does not port, does not close this story.
