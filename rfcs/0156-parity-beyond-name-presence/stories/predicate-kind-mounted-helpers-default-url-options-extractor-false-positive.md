---
title: "predicate-kind-mounted-helpers-default-url-options-extractor-false-positive"
status: draft
updated: 2026-09-29
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After `predicate-kind-residue-class-attribute-predicates`, one row is left in
`scripts/api-compare/predicate-kind-mark.json` (`actiondispatch: 1`):
`routing/route_set.rb` `default_url_options?` on
`ActionDispatch::Routing::RouteSet::MountedHelpers`, credited through
`defaultUrlOptions` in `packages/actionpack/src/action-dispatch/routing/route-set.ts`.

Rails does not define that predicate. `MountedHelpers` is a Module
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/route_set.rb:499-502`,
`module MountedHelpers; extend ActiveSupport::Concern; include UrlFor; end`).
UrlFor's `included` block (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/url_for.rb:97-106`)
calls `class_attribute :default_url_options` only `if respond_to?(:class_attribute)`.
`class_attribute` is defined on `Class` (`activesupport/lib/active_support/core_ext/class/attribute.rb`),
so a Module takes the `mattr_writer :default_url_options` arm, which defines no
predicate. `scripts/api-compare/extract-ruby-api.rb` dispatches `class_attribute`
to `process_mattr(..., predicate: true)` (around `:937` and `:1009`)
without looking at the enclosing `respond_to?(:class_attribute)` guard, so every
includer of UrlFor, Module or Class, is credited with `default_url_options?`.

## Acceptance criteria

- The Ruby extractor does not credit `default_url_options?` to a Module includer
  of `ActionDispatch::Routing::UrlFor` (for example by modeling the
  `respond_to?(:class_attribute)` / `mattr_writer` split in `url_for.rb:99-103`).
  Class includers such as `RoutesProxy` keep the predicate.
- `pnpm parity:api:predicates:tighten` narrows `actiondispatch` to 0 and
  `predicate-kind-mark.json` ends empty.
- No TS predicate is invented on `MountedHelpers` to clear the row.
