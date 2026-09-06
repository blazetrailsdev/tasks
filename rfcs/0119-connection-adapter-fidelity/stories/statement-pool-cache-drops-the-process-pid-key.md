---
title: "statement-pool-cache-drops-the-process-pid-key"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 7557
claim: "2026-09-06T14:18:20Z"
assignee: "api-compare-pairs-a-ruby-predicate-and-instance-new-onto-one-ts-member"
blocked-by: null
closed-reason: null
---

## Context

Rails keys the statement pool's cache by pid so a forked child never inherits
the parent's prepared statement handles:

```ruby
def cache
  @cache[Process.pid]
end
```

`vendor/rails/activerecord/lib/active_record/connection_adapters/statement_pool.rb:59-62`
— `@cache` is a Hash of pid → Hash, and every reader
(`length`, `[]`, `[]=`, `key?`, `delete`, `clear`, `each`) goes through it.

`packages/activerecord/src/connection-adapters/statement-pool.ts:65-67` drops
the pid dimension entirely — `_cache` is one flat `Map` and `cache` returns it:

```ts
private get cache(): Map<string, T> {
  return this._cache;
}
```

The receiver is now portable: `Process` landed in `ruby-compat` in #7438
(`packages/ruby-compat/src/process.ts`, `vendor/ruby/process.c:9129`), and
`Process.pid` (`proc_get_pid`, `process.c:530`) was deliberately left unported
there because it had no call site — this is that call site.

Note the call gate cannot see this omission: `clock_gettime` and `pid` are not
themselves ported Rails methods, so `parity:api:calls` scores the body as
matching. It is a grep finding, not a red run.

## Converged shape

- `Process.pid` ported in `packages/ruby-compat/src/process.ts`, reading the
  running process's id through the `ProcessAdapter` backend (it has no `pid()`
  member yet — add one, the way `platform()` and `cwd()` are carried).
- `_cache` becomes the pid → Map shape Rails has, and `cache` becomes
  `this._cache.get(Process.pid())`, with the same lazy-insert Rails' `Hash.new`
  block gives it (`statement_pool.rb:26`).
- Every reader keeps going through `cache`, unchanged.

The keying is degenerate in a single-process host — that is fine and is the
point: a Rails dev reads the same body, and a host that ever does have a second
pid (`cluster` workers already do) gets Rails' isolation rather than trails'
silence.

## Acceptance criteria

- `statement-pool.ts`'s `cache` mirrors `statement_pool.rb:59-62` line for line.
- `Process.pid` exists in `ruby-compat` with its MRI citation
  (`vendor/ruby/process.c:530`) and a `@noRailsEquivalent PERMANENT` receipt.
- `pnpm parity:api:extra:gate` stays green — `ruby-compat` is pinned at
  `novel 0`, so the new name needs its receipt.
