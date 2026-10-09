---
title: "ViewPaths and ParameterEncoding reach ActionController::Base through include, not extend and class-body assignment"
status: ready
updated: 2026-10-09
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/base.ts` still hand-extends two
`ClassMethods` objects between its `include(Base, X)` lines (after trails#8639):

- `extend(Base, ViewPathsClassMethods)` after `include(Base, Layouts)`. Rails
  gets `ActionView::ViewPaths::ClassMethods` through the Concern dependency
  chain `ActionView::Layouts` -> `ActionView::Rendering` -> `ActionView::ViewPaths`
  (`vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:207`,
  `rendering.rb:28`, `view_paths.rb:5-18`), with no call in
  `action_controller/base.rb`.
- `extend(Base, ParameterEncoding.ClassMethods)` where Rails has
  `include ParameterEncoding`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/base.rb:292`,
  `metal/parameter_encoding.rb:6-9`).

`Base`'s class body also assigns ViewPaths members one at a time
(`_prefixes = _prefixes`, `detailsForLookup`, `templateExists`,
`isAnyTemplates`, `prependViewPath`, and the `lookupContext` / `viewPaths` /
`formats` / `locale` accessors), which are own properties that beat the included
module (`view_paths.rb:20-128`).

## Acceptance criteria

- `ViewPaths` carries its `ClassMethods` and instance members as a Concern, so
  `include(Base, Layouts)` brings them and the `extend` line and the class-body
  assignments are gone.
- `ParameterEncoding` is a Concern `Module` included at its `MODULES` position.
- The actionpack and actionview suites stay green.
