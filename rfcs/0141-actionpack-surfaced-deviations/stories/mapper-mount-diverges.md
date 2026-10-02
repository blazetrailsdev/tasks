---
title: "Mapper#mount: target_as, the Hash argument arm, ArgumentError, and the invented _mountedApps map"
status: done
updated: 2026-10-02
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8407
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mapper#mount` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`, the
`mount(app, options = {})` method) diverges from `Mapper::Base#mount`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:610-637`).
Found while converging `define_generate_prefix` in trails#8410, which left
`mount` itself untouched:

- Rails computes `target_as = name_for_action(options[:as], path)` (`:631`) and
  hands `target_as` to `define_generate_prefix` (`:636`). trails passes the raw
  `options.as ?? appName(...)`, so an engine mounted inside a `namespace` or an
  `as:`-carrying `scope` registers its mounted helper and its
  `find_script_name` override under the unprefixed name, and
  `@set.named_routes.get name` (`:671`) then looks up a route that was added
  under the prefixed one.
- Rails has two argument arms (`:611-617`): `mount(app, options)` with
  `options.delete(:at)`, and the Hash arm `mount(SomeRackApp => "some_route")`,
  which finds the pair whose key answers `call` and deletes it. trails has only
  the first.
- trails records `{ app, path }` in an invented `_mountedApps` map that nothing
  reads (`grep -rn _mountedApps packages` finds only the write and the field).
- Rails raises `ArgumentError` for both guards (`:619-627`), and the mount-point
  message has four lines, ending `or` / `mount(SomeRackApp => "some_route")`.
  trails throws a bare `Error` with a two-line message.
- Rails builds the route with
  `match(path, { to: app, anchor: false, format: false }.merge(options))`
  after `options[:as] ||= app_name(app, rails_app)` and `options[:via] ||= :all`
  (`:629-634`), and returns `self` (`:637`). trails assembles a separate
  `matchOpts` object, deletes `at` from it, and returns `void`.

## Acceptance criteria

- `mount` mirrors `mapper.rb:610-637` line for line: both argument arms, both
  `ArgumentError`s with Rails' messages, `rails_app` / `target_as` locals,
  `options[:as] ||=` and `options[:via] ||=` on the options hash, the `match`
  call, `define_generate_prefix(app, target_as) if rails_app`, and `self`.
- `_mountedApps` is removed.
- A trails test mounts an `Engine` inside a `namespace` and asserts the mounted
  helper is defined under the prefixed name and generates the prefixed path.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green.
