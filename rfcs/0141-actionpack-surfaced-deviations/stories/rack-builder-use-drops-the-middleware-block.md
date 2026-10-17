---
title: "rack-builder-use-drops-the-middleware-block"
status: draft
updated: 2026-10-17
rfc: "0141-actionpack-surfaced-deviations"
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

`Rack::Builder#use(middleware, *args, &block)` (`vendor/rack/v3.1.14/lib/rack/builder.rb:159-165`)
pushes `proc { |app| middleware.new(app, *args, &block) }`. trails' `Builder#use`
(`packages/rack/src/builder.ts`) takes `(middleware, ...args)` and has no slot for
the block, so a middleware whose constructor takes a block (`use Rack::Auth::Basic do |u, p| ... end`)
can only receive it as a positional argument.

## Acceptance criteria

- `use` takes Rails' block in its own slot, in the repo's settled trailing-block shape,
  and passes it to the middleware's constructor after `args`.
- A `builder.test.ts` case for a block-taking middleware passes.
