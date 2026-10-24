---
title: "solid-queue-compare-app-models"
status: done
updated: 2026-10-23
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9280
claim: "2026-10-23T22:26:41Z"
assignee: "port-solid-queue-engine"
blocked-by: null
closed-reason: null
---

## Context

`vendor/sources.ts` enrolls `solid_queue` with `libPath: "lib/solid_queue"`
only, so `parity:api` sees none of the gem's models under
`vendor/solid_queue/v1.1.3/app/models/solid_queue/`. Every member of
`packages/solid-queue/src/{job,execution,record,ready-execution,scheduled-execution}.ts`
and `job/`, `execution/` reports "no Rails counterpart" in
`pnpm parity:api:extra --package solid-queue`, and `pnpm parity:api` failed with
"@inlinedFrom names no Ruby body: … the manifest has no
`SolidQueue::Job::Schedulable#execution`", so `Job#execution` in `job.ts`
carries no `@inlinedFrom` tags for `job/schedulable.rb:43-45` and
`job/executable.rb:107-109`.

## Acceptance criteria

- The compare tooling extracts `app/models/solid_queue/**` (and `app/jobs`)
  for `solid-queue`, mapping `app/models/solid_queue/x.rb` to `src/x.ts`.
- `Job#execution` carries its `@inlinedFrom` tags and `pnpm parity:api:inlined` is green.
- The ported models match their Ruby counterparts in `parity:api`.
