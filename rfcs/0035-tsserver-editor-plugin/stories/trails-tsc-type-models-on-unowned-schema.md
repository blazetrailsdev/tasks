---
title: "trails-tsc: type models on a database whose schema the app does not own"
status: draft
updated: 2026-10-31
rfc: "0035-tsserver-editor-plugin"
cluster: null
packages: ["trails-tsc"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap's stats models (`PullRequest`, `CompareRun` and its five subclasses) read a database another repository's cron writes, so no `db/*schema.ts` exists and they are marked `@trails-typegen no-schema`. Every column stays a hand-written `declare`. Rails would type nothing here and needs no dump; trails' zero-declare path has no answer for a read-only external database short of committing a dump that can drift.

Found by `typecheck-trailmap-with-trails-tsc-and-drop-model-declares`.

## Acceptance criteria

- A supported way exists to give trails-tsc the columns of an externally owned database, such as dumping a schema from a named connection, with a test, or the story records that `declare` is the supported spelling for such a model.
- trailmap's stats model `declare`s naming this story are resolved.
