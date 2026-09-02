---
title: "Mapper#namespace drops Rails' shallow_path/shallow_prefix defaults and the options merge"
status: done
updated: 2026-09-02
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 7
pr: 7389
claim: "2026-09-02T13:34:18Z"
assignee: "param-name-check-pairs-nested-class-constructor-with-enclosing-initialize"
blocked-by: null
closed-reason: null
---

## Context

`Mapper#namespace` gained its Rails `options` parameter in PR #7211 (RFC 0128),
but only three of the keys Rails derives, and none of Rails' surrounding
structure. Rails
(`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:961-974`):

```ruby
def namespace(path, options = {}, &block)
  path = path.to_s

  defaults = {
    module:         path,
    as:             options.fetch(:as, path),
    shallow_path:   options.fetch(:path, path),
    shallow_prefix: options.fetch(:as, path)
  }

  path_scope(options.delete(:path) { path }) do
    scope(defaults.merge!(options), &block)
  end
end
```

The trails port
(`packages/actionpack/src/action-dispatch/routing/mapper.ts:372-396`) reads
`opts.path ?? path`, `opts.as ?? path` and `opts.module ?? path` and pushes them
straight onto `scopeStack` as `path` / `namePrefix` / `controller`. So:

- `shallow_path` and `shallow_prefix` are never derived, so a `shallow` block
  inside a `namespace` cannot see the namespace segment.
- Any OTHER key in `options` is silently dropped — Rails merges the whole hash
  into the `scope` call (`defaults.merge!(options)`), so `namespace :admin,
constraints: {...}` carries the constraint and trails discards it.
- `options.delete(:path)` means Rails consumes `:path` before the merge, so a
  `:path` given by the caller sets the URL segment and does NOT survive into the
  scope; the port has no equivalent consumption.
- Rails routes through `path_scope` + `scope`; the port pushes a raw
  `scopeStack` frame, so `namespace` does not compose with the scope machinery
  the way every other Rails scoping method does.

`ruby -e` against MRI is not needed here — the divergence is structural and
visible in the two bodies.

## Acceptance criteria

- `namespace` builds Rails' `defaults` hash — `module`, `as`, `shallow_path`,
  `shallow_prefix` — with Rails' `options.fetch(:as, path)` /
  `options.fetch(:path, path)` semantics (`fetch`, not `??`: a stored `nil`
  or `false` is returned, per CLAUDE.md's "fetch vs ??").
- It consumes `:path` with Rails' `options.delete(:path) { path }` default-block
  semantics and calls `path_scope` + `scope(defaults.merge!(options))`, so
  unlisted option keys reach the scope instead of being dropped.
- A `shallow` block nested inside a `namespace` sees the namespace's
  `shallow_path` / `shallow_prefix`.
- Test names come from
  `vendor/rails/actionpack/test/dispatch/routing_test.rb` verbatim.
- `pnpm parity:api:calls` / `:calls:args` show no new row; `parity:api:params`
  stays at actiondispatch's mark or lower.
