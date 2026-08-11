---
title: "establish_connection's role/shard default off Base like owner_name now does"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6380
claim: "2026-08-11T21:46:04Z"
assignee: "converge-association-build-record-build-association"
blocked-by: null
closed-reason: null
---

## Context

Found while landing `converge-establish-connection-owner-name-default` (PR #6375).

`establish_connection` defaults all three of its selector kwargs off `Base`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:115`):

```ruby
def establish_connection(config, owner_name: Base, role: Base.current_role, shard: Base.current_shard, clobber: false)
```

PR #6375 converged `owner_name: Base` — the handler now reaches `Base` at call
time through a `_registerBase` slot (`connection-adapters/abstract/
connection-handler.ts`, the same shape `schema-migration.ts` uses), because an
eager `import` would close a module cycle.

`role` and `shard` were NOT converged and are still hardcoded literals in
`establishConnection`:

```ts
const role = options.role ?? "writing";
const shard = options.shard ?? "default";
```

They diverge whenever a caller is inside `connected_to(role:)` / `connected_to(shard:)`:
Rails picks up the _currently swapped_ role/shard, trails always lands in
writing/default. The same hardcoding appears in the sibling readers Rails also
defaults off `Base` — `retrieve_connection` (`connection_handler.rb:193`) and
`connected?` (`:200`).

The blocker that justified the literals is now gone: `_base` is already in this
file, so `Base.currentRole` / `Base.currentShard` are reachable at call time
exactly where Ruby resolves them.

## Converged shape

`establishConnection`'s `role` / `shard` default to `Base.currentRole` /
`Base.currentShard` via the existing `_base` binding, matching
`connection_handler.rb:115`, with the pre-load window falling back to the
current literals the way `ownerName` already does. `retrieveConnection` and
`connectedQ` follow (`:193`, `:200`).

## Acceptance criteria

1. `establishConnection`'s `role` and `shard` resolve through `Base` as
   `connection_handler.rb:115` does, not through hardcoded `"writing"` /
   `"default"`.
2. `retrieveConnection` (`:193`) and `connectedQ` (`:200`) get the same
   defaults.
3. A test proves a `connectedTo({ role })` / `connectedTo({ shard })` block
   reaches the swapped pool without naming the kwarg — this is the behavioural
   difference, and it is currently invisible.
4. The multi-database and `connection-handling` suites stay green (a wrong
   default silently reroutes pools).
