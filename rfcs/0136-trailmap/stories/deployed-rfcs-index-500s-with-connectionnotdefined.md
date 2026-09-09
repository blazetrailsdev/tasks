---
title: "Deployed trailmap /rfcs 500s with ConnectionNotDefined"
status: ready
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord", "trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The deployed trailmap returns a 500 on its RFC index:

```text
GET https://trailmap.deanoftech.com/rfcs
<error>
  <status>500</status>
  <message>Internal Server Error</message>
  <exception>ConnectionNotDefined</exception>
  <detail>No database connection defined.</detail>
</error>
```

`ConnectionNotDefined` is raised in exactly one place,
`packages/activerecord/src/connection-adapters/abstract/connection-handler.ts:285-299`,
from `retrieveConnectionPool` when `strict` is set and no pool is found.

The message text pins down which lookup missed. The suffix is assembled from
the non-default parts of the request: a `shard !== "default"` contributes
`'<shard>' shard`, a `role !== "writing"` contributes `'<role>' role`, and a
`connectionName !== "ActiveRecord::Base"` contributes the connection name. The
observed message has **no suffix at all** — bare `No database connection
defined.` — so the failing lookup was for `ActiveRecord::Base`, the `writing`
role, and the `default` shard. That is the ordinary connection, not a replica,
shard, or named-connection misconfiguration: the deployed process had no pool
established for `Base` at the moment the request ran.

Two candidate shapes, and the story should establish which before fixing:

1. The connection is never established in the deployed boot path — the
   trailtie/initializer that would call `establishConnection` does not run, or
   runs after the first request is served.
2. The connection is established at boot but is not visible to the request —
   lost across an async boundary, a per-request execution context, or a
   worker/process that did not inherit it.

A local `tasks` CLI run against the same `tasks.db` works, so this is specific
to the served application, not to the model layer or the database file.

**Second, separable defect visible in the same response:** the error body is
**XML**. Rails' `PublicExceptions` / `DebugExceptions` render HTML or JSON;
neither emits an `<error>` document, and the browser reports no stylesheet
because nothing is meant to consume it. Whatever content-negotiated its way to
XML is a divergence from Rails' exception-rendering path in its own right. It
is worth filing separately once identified rather than folding into the
connection fix — it will keep misrendering every future 500.

## Acceptance criteria

- `GET /rfcs` on the deployed trailmap returns the RFC index, not a 500.
- The root cause is stated explicitly: which of the two shapes above (or a
  third) actually held, with the boot-path or request-path `file:line` that
  proves it.
- A regression test fails on the current baseline and passes after the fix.
  If the cause is boot ordering, the test must exercise the boot path — a test
  that establishes a connection itself would pass on the baseline and prove
  nothing.
- If the cause turns out to be a trails framework gap rather than trailmap
  wiring, file it against the framework per RFC 0136's proving-ground clause
  and link it here.
- The XML error-rendering defect is either fixed or filed as its own story
  with the negotiation path identified.
