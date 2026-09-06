---
title: "Serve the mutation verbs, making trailmap the sole writer"
status: done
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: ["move-mutation-verbs-onto-the-models"]
deps-rfc: []
est-loc: 200
priority: 6
pr: 6
claim: "2026-09-05T23:01:36Z"
assignee: "serve-the-mutation-verbs-as-json"
blocked-by: null
closed-reason: null
---

## Context

The mutation half of the API: `claim`, `release`, `in-progress`, `done`,
`record-spawn`, `block`, `close`, `status-set`, `priority`. These wrap the
instance methods from the verbs story and, on landing, make trailmap the
**sole writer** of `tasks.db`.

That is the point of no return for this RFC, and the RFC accepts its cost
explicitly: with the CLI behind the API, trailmap being down stops the fleet,
where today any worktree can mutate the database unilaterally. The mitigation
is a restart policy and a health check, not a second code path — a read-only
fallback would resurrect the second read model this whole RFC exists to delete.

So this story owns the operational side too: the app must come back by itself,
and its failure must be visible.

Concurrency stops being a correctness problem here rather than starting to be
one — today the CLI writes from every worktree plus the container, and the Go
process reads underneath. One writer in one process is strictly simpler.

## Acceptance criteria

- Every mutation verb has an endpoint, running the model methods in one
  transaction and writing its `events` row.
- Each returns the same refusals the CLI returns, with the same messages.
- trailmap can write `tasks.db`: the connection is no longer read-only, and
  one in-process connection serializes the verbs. Becoming the ONLY writer is
  `move-the-tasks-cli-into-trailmap`, which deps on this story because the
  endpoints have to exist before the CLI can be pointed at them — the two
  cannot land together, so stating the guarantee here made this story
  unsatisfiable on its own terms.
- The app has a restart policy and a health check, and a deliberate kill is
  shown to recover without intervention.
