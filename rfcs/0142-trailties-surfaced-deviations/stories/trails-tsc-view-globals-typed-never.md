---
title: "trails-tsc-view-globals-typed-never"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
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

`trails-tsc --schema db/schema.ts --noEmit` on examples/chatter reports `never` for names a view reaches at
run time: autoloaded constants (`Current`, `Reaction`, `Message`), `flash`, `params`, `contentFor`,
`turboStreamFrom`, `turboFrameTag`, and app-helper methods. 43 errors, all from views except model
`broadcast*` instance methods installed by turbo's Broadcastable (packages/turbo/lib/app/models/concerns/turbo/broadcastable.ts)
and `generatesTokenFor`'s `expiresIn` typed `number` where Rails takes a Duration.

## Acceptance criteria

- `trails-tsc --noEmit` on examples/chatter reports no error for a name that resolves at run time.
- `generatesTokenFor`'s `expiresIn` accepts a Duration.
