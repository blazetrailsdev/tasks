---
title: "Seat Thor::Base's find_and_refresh_task alias and dispatch from_superclass through this in thor/actions.ts"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/base.rb:717` is `alias_method :find_and_refresh_task, :find_and_refresh_command`.
trails#8464 ported `findAndRefreshCommand` in `packages/trailties/src/thor/base.ts` (`ClassMethods`) and left the
alias out; `parity:api --package thor` lists `find_and_refresh_task` as missing. `ClassMethods` is an object
literal, so the alias cannot name its sibling inside the literal.

The other `*_task` aliases in `base.rb` (`tasks` `:474`, `all_tasks` `:486`, `remove_task` `:509`, `no_tasks`
`:534`, `public_task` `:611`, `handle_no_task_error` `:616`, `create_task` `:784`) alias methods owned by
`port-thor-base-command-registry-method-added-and-start`, whose body does not list them. Check that story first and
port whichever are still missing in the same shape.

Also in scope: `packages/trailties/src/thor/actions.ts` `sourcePathsForSearch` still calls
`fromSuperclass.call(this, "sourcePaths", [])`. Rails calls `from_superclass(:source_paths, [])` on self
(`vendor/thor/v1.3.2/lib/thor/actions.rb:38`); once a host has `Thor::Base::ClassMethods`, it reads
`this.fromSuperclass("sourcePaths", [])` as every site in `base.ts` does.

## Acceptance criteria

- [ ] `findAndRefreshTask` is the same function as `findAndRefreshCommand` on `ClassMethods`, and `parity:api
    --package thor` credits `find_and_refresh_task`.
- [ ] Any `*_task` alias still missing after the command-registry story is seated the same way.
- [ ] `actions.ts` dispatches `from_superclass` through `this`, with the bare `fromSuperclass` import dropped.
