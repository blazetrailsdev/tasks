---
title: "connected_to_many passes Rails' kwargs to append_to_connected_to_stack"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6370
claim: "2026-08-11T17:44:26Z"
assignee: "pg-reset-body-under-one-lock"
blocked-by: null
closed-reason: null
---

## Context

Left unconverged by `call-args-ar-kwargs-vs-positional` (PR #6360).

Rails `connected_to_many`
(`activerecord/lib/active_record/connection_handling.rb:165-178`):

```ruby
append_to_connected_to_stack(role: role, shard: shard, prevent_writes: prevent_writes, klasses: classes)
yield
ensure
  connected_to_stack.pop
```

trails (`packages/activerecord/src/connection-handling.ts`, `connectedToMany`)
builds the hash into an `entry` local first and passes `entry`, because it
unwinds with `removeStackEntry(entry)` — removing that specific entry by
identity — rather than Rails' `connected_to_stack.pop`. The identity is needed
because trails' unwind runs through `withCleanup` around a possibly-async body,
where a bare `pop` could remove a sibling scope's entry.

The same shape appears at the second `appendToConnectedToStack(entry)` call site
in this file (`connectedToAllShards`-adjacent, ~L691).

## Converged shape

Either establish that a LIFO `pop` is safe under trails' async unwind and use
Rails' `connected_to_stack.pop` in the cleanup — which lets the call site inline
the kwargs literal exactly as Rails writes it — or, if the identity-based removal
is genuinely required, converge the argument by inlining the literal at the call
and capturing it in the same expression, so the Rails argument list is what the
reader sees.

Note `append_to_connected_to_stack(entry)` itself takes a positional hash in
Rails (`connection_handling.rb:405-411`) — only the _call_ is kwargs.

## Acceptance criteria

1. `connected_to_many` passes what `connection_handling.rb:174` passes, in
   Rails' key order.
2. If `pop` replaces `removeStackEntry`, a regression test covers the
   nested/async unwind case that motivated the identity removal, and it fails on
   the pre-change implementation.
3. The `connection-handling.ts` `connected_to_many` →
   `append_to_connected_to_stack` row is deleted from the baseline by hand.
4. `pnpm parity:api:calls:args` stays green.
