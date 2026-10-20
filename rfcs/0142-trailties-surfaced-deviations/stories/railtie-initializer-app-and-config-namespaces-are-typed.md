---
title: "railtie-initializer-app-and-config-namespaces-are-typed"
status: done
updated: 2026-10-20
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9117
claim: "2026-10-20T02:13:40Z"
assignee: "railtie-initializer-app-and-config-namespaces-are-typed"
blocked-by: null
closed-reason: null
---

## Context

A framework railtie (activejob's `railtie.rb`, activerecord's) is written against two railties APIs that trails leaves untyped.

**Initializer blocks.** `initializer(name, opts = {}, &blk)` (`vendor/rails/v8.0.2/railties/lib/rails/initializable.rb:88`) runs each block with the application as its argument: `initializer "active_job.custom_serializers" do |app|`. trails types the block `InitializerBlock<C> = (this: C, ...args: unknown[]) => unknown` (`packages/trailties/src/initializable.ts:11`), so `app` is `unknown`, and `app.config.active_job…` does not type-check without a cast.

**Configuration namespaces.** `config.active_job` is answered by `Rails::Railtie::Configuration#method_missing` (`vendor/rails/v8.0.2/railties/lib/rails/railtie/configuration.rb:99`), a Proxy in trails (CLAUDE.md, "Ruby protocol methods"). trails' `Configuration` (`packages/trailties/src/trailtie/configuration.ts:16`) declares no such namespaces, so `config.activeJob.customSerializers` has no type either.

The generated activejob railtie (codegen-native-inference) reports about 36 errors from these two: 11 on `app` and the rest on `config.*` reads.

## Acceptance criteria

- An initializer block receives the application typed: `InitializerBlock<C>` passes the `Application`, which Rails hands every initializer (`run_initializers(group, self)`, `vendor/rails/v8.0.2/railties/lib/rails/application.rb:440`), rather than `...args: unknown[]`. A block's `app.config` type-checks.
- A framework adds its config namespace to `Configuration` with a module augmentation (`declare module "@blazetrails/trailties" { interface Configuration { activeJob: OrderedOptions } }`, or the equivalent for the package that owns it), so `config.activeJob.x` type-checks. The Proxy run time is unchanged.
- A trails test defines an initializer that reads `app.config` and a config namespace through the augmentation, with no cast.
