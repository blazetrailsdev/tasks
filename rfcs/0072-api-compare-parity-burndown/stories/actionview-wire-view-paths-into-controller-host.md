---
title: "Wire ActionView::ViewPaths into a controller host"
status: closed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope for RFC 0072 after scope tightening (2026-07-26): this RFC targets activerecord parity plus only the surface necessary to support it; actionview parity is not pursued here - re-file under a dedicated actionview RFC if that campaign opens"
---

## Context

PR #5350 ported `ActionView::ViewPaths` to
`packages/actionview/src/view-paths.ts`, but nothing includes it yet: no class
in the repo assigns `ClassMethods.*` as statics or the instance functions onto
its prototype. The module's tests build their own stand-in host.

Rails mixes it in from `AbstractController::Base` via
`ActionView::Rendering` / `AbstractController::Rendering`
(`vendor/rails/actionpack/lib/abstract_controller/rendering.rb`,
`vendor/rails/actionview/lib/action_view/rendering.rb:10`), which is what gives
controllers `view_paths`, `append_view_path`, `lookup_context` and `_prefixes`.

The host contract the port expects is already satisfied by
`packages/actionpack/src/abstract-controller/base.ts`: it has `isAbstract()`
(base.ts:162) and `controllerPath()` (base.ts:181), which are the only two
members `ViewPathsClass` requires — the interface is structural precisely so
ActionView keeps no dependency on ActionPack.

Rails runs `PathRegistry.set_view_paths(self, PathSet.new.freeze)` from
`included do` (view_paths.rb:8). TS has no include hook, so the port returns a
shared empty `PathSet` from `_view_paths` instead; whoever wires the mixin
should decide whether the host registers its own set explicitly at class
definition time.

## Acceptance criteria

- A controller host (`AbstractController::Base` or the ActionView-side
  `Rendering` module that includes ViewPaths) carries the ViewPaths surface:
  class side assigned as statics, instance side on the prototype, per
  CLAUDE.md's module-mixin convention.
- Ported `view_paths_test.rb` cases that need a real controller
  (`test_view_paths_override`, `test_view_paths_override_at_request_time`,
  `test_decorate_view_paths_with_custom_resolver`, the template append/prepend
  cases) become portable; port what the wiring unblocks.
- The empty-PathSet-at-include question above is resolved one way or the other.
