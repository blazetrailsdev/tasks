---
title: "Port DependencyTracker's registry and WildcardResolver"
status: done
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: []
deps-rfc: []
est-loc: 250
priority: 10
pr: 7628
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionview/lib/action_view/dependency_tracker.rb` (41 lines, 3
methods) is the registry the digestor calls into, and
`dependency_tracker/wildcard_resolver.rb` (32 lines, 6 methods) is what turns a
`"comments/*"` dependency into concrete template paths. Both are absent from
`packages/actionview/src/`.

The registry is small and entirely mechanical:

- `find_dependencies(name, template, view_paths = nil)` — looks up
  `@trackers[template.handler]`, returns `[]` when there is no tracker
  (`dependency_tracker.rb:19-24`).
- `register_tracker(extension, tracker)` — resolves the handler via
  `Template.handler_for_extension(extension)`, then stores the tracker directly
  if it responds to `supports_view_paths?`, else wraps it in a lambda that drops
  the third argument (`:26-33`).
- `remove_tracker(handler)` — `@trackers.delete` (`:35-37`).

`@trackers` is a `Concurrent::Map`; a plain `Map` is the trails analogue.

`WildcardResolver#initialize` partitions dependencies on `end_with?("/*")`;
`#resolve` returns `explicit_dependencies.uniq` when there are no view paths or
no wildcards, else adds `resolved_wildcard_dependencies` — which strips the
trailing `/*`, flat-maps `all_template_paths` across view paths, keeps the paths
whose `prefix` is in the set, and sorts (`wildcard_resolver.rb:14-30`).

`register_tracker :erb, ERBTracker` at `:38` is the file's only default
registration and lands in `tse-tracker-ports-the-erb-regex-tracker`, not here.

## Converged shape

`packages/actionview/src/dependency-tracker.ts` with the three static methods,
and `packages/actionview/src/dependency-tracker/wildcard-resolver.ts`. The
`supports_view_paths?` branch ports as a `respond_to?`-shaped check on the
tracker object, keeping both arms — the lambda-wrapping arm is what lets a
third-party two-argument tracker register, and dropping it is a silent gap.

`PathSet#all_template_paths` and `TemplatePath#prefix` already exist
(`path-set.ts`, `template-path.ts`); verify both before porting `resolve` rather
than assuming their shape.

## Acceptance criteria

- `dependency_tracker.rb` and `dependency_tracker/wildcard_resolver.rb` both
  report 0 missing in `pnpm parity:api --package actionview`.
- `findDependencies` returns `[]` for a handler with no registered tracker.
- A tracker without `supportsViewPaths` is registered through the wrapping arm
  and receives two arguments, not three.
- `resolve` sorts wildcard expansions and de-duplicates against the explicit
  set; a wildcard with no view paths returns the explicit set alone.
- No new runtime dependency in `packages/actionview/package.json`.
