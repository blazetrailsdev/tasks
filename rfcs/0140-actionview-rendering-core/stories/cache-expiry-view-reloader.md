---
title: "Port CacheExpiry::ViewReloader and the resolver hook it registers into"
status: ready
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
cluster: null
packages:
  - "actionview"
deps: ["port-resolver-caching-and-cache-template-loading"]
deps-rfc: []
est-loc: 250
priority: 12
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionview/lib/action_view/cache_expiry.rb` (8 methods) is the
dev-mode half of ActionView's caching story, and it is absent from trails.

`railtie.rb:107-123` decides the environment split once:

```ruby
enable_caching = app.config.action_view.cache_template_loading.nil? ?
  !app.config.reloading_enabled? : app.config.action_view.cache_template_loading

unless enable_caching
  view_reloader = ActionView::CacheExpiry::ViewReloader.new(watcher: app.config.file_watcher)
  app.reloaders << view_reloader
  app.reloader.to_run { require_unload_lock!; view_reloader.execute }
end
```

`ViewReloader` (`cache_expiry.rb:5-63`) registers `method(:rebuild_watcher)`
into `ActionView::PathRegistry.file_system_resolver_hooks` at construction,
lazily builds a watcher over `dirs_to_watch` (every file-system resolver's
path, uniq and sorted), and on change calls
`ActionView::LookupContext::DetailsKey.clear`. `build_watcher` checks the old
watcher AFTER installing the new one, deliberately, so no event is missed
across a rebuild (`:44-52` carries the comment).

Half the receiving end already exists: `lookup-context.ts:99-153` has
`DetailsKey`, `_digestCache` and `clear()`. What is missing is
`fileSystemResolverHooks` on `packages/actionview/src/path-registry.ts` —
`grep -n fileSystemResolverHooks packages/actionview/src/path-registry.ts`
finds nothing — and `ViewReloader` itself.

This story is the dev arm only. `Resolver.caching`, `Base.cacheTemplateLoading`
and the `action_view.caching` initializer are
`port-resolver-caching-and-cache-template-loading` (RFC 0104, ready), which this
depends on: without it there is no `enable_caching` to branch on.

## Converged shape

`packages/actionview/src/cache-expiry.ts` with `ViewReloader`, plus
`fileSystemResolverHooks` and `allFileSystemResolvers` on `path-registry.ts` at
the Rails names. The trailtie registers the reloader in the `unless
enable_caching` arm, mirroring `railtie.rb:113-121`.

Ruby's `Mutex` has no JS counterpart because the reload path is single-threaded
here; the `@mutex.synchronize` blocks port as plain sequential code. Keep the
ordering they enforce — the old-watcher check must still happen after the new
watcher is installed, since that ordering is the bug fix the Rails comment
documents, not an artifact of locking.

## Acceptance criteria

- `cache_expiry.rb` reports 0 missing in `pnpm parity:api --package actionview`.
- `PathRegistry.fileSystemResolverHooks` exists and `ViewReloader` registers
  `rebuildWatcher` into it at construction; appending a resolver after
  construction rebuilds the watcher.
- `execute` is a no-op when no watcher has been built.
- `reload!` clears `DetailsKey`, and a test asserts the digest cache is empty
  afterwards.
- A watcher rebuild triggered by a changed view-path set does not lose a change
  that landed on the old watcher — the `railtie.rb` ordering is pinned by a test.
- The reloader is registered only when caching is disabled; a prod-shaped config
  registers nothing.
