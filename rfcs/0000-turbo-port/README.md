---
rfc: "0000-turbo-port"
title: "Port the turbo-rails gem as @blazetrails/turbo"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "turbo"
  - "activerecord"
  - "actioncable"
clusters:
  - turbo
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. -->

# RFC — Port the turbo-rails gem as @blazetrails/turbo

## Summary

Port `turbo` v2.0.23 as `@blazetrails/turbo`. It covers the
Engine, the `turbo_stream` MIME type and renderer, the view helpers, frames,
`StreamsChannel` and broadcasts, `Turbo::Broadcastable`, the test helpers,
and the non-importmap `turbo:install`. Part of the `hotwire-via-vite` meta RFC.

## Motivation

`AppBase#runHotwire` (`packages/trailties/lib/generators/app-base.ts:758`)
already calls `turbo:install`, which nothing defines. Measured: 27 `.rb`
files, 2,160 LOC, 163 public and 18 internal methods, and 247 upstream tests
in 18 files. The JavaScript under `app/javascript/turbo/` is the npm
`@hotwired/turbo-rails` and is not ported.

## Design

`packages/turbo` mirrors `lib/turbo` plus the
`app/{channels,controllers,helpers,jobs,models}/turbo` dirs that
`vendor/sources.ts` maps. Every test runs against the gem's `test/dummy` app,
which is ported verbatim first (`turbo-dummy-test-app`). `Broadcastable`
is included onto `ActiveRecord::Base` through `on_load(:active_record)`, and
`StreamsChannel` subclasses trails' `ActionCable::Channel::Base`. The package
stays Vite-free. Only `turbo:install`'s template knows the entrypoint path,
per the meta RFC ruling.

## Non-goals

- **`turbo:install:importmap` and `turbo_with_importmap.rb`.** They depend on
  importmap-rails.
- **Capybara selectors with no Vitest counterpart** in
  `lib/turbo/system_test_helper.rb`. These are `PERMANENT-SKIP` per the
  system-testing ruling in `packages/actionpack/CLAUDE.md`.
- **The JavaScript under `app/javascript/turbo/` and
  `app/assets/javascripts/turbo.js`.** These are npm dependencies.

## Alternatives considered

- **Depend on `@hotwired/turbo` instead of `@hotwired/turbo-rails`.**
  Broadcasts need `<turbo-cable-stream-source>`, which only the
  `turbo` npm package provides. Rejected (meta RFC open question 5).

## Rollout

1. `turbo-dummy-test-app`.
2. `turbo-package-helpers-and-turbo-stream-format`.
3. `turbo-frames-native-and-request-id` and
   `turbo-streams-tag-builder`.
4. `turbo-broadcasts-and-streams-channel`.
5. `turbo-broadcastable-instance-broadcasts`, then
   `turbo-broadcastable-class-methods-and-callbacks`.
6. `turbo-test-helpers` and `turbo-install-task`.

## Verification

- `pnpm parity:api turbo` reaches 163 public methods.
- `parity:test`: 247 = matched + `PERMANENT-SKIP`. A skip is allowed only for
  an importmap-only arm or a Capybara-selector arm with no Vitest
  counterpart.

## Open questions

None of its own. The entrypoint path and the npm package follow the meta
RFC's open questions 3 and 5.

## Changelog

- 2026-11-12: split out of the `hotwire-via-vite` meta RFC.
