---
title: "Retire UNSCORED_SUBDIRS once activerecord/lib/pg is empty"
status: done
updated: 2026-11-19
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10384
claim: "2026-11-19T22:52:37Z"
assignee: "call-args-gate-resolves-inherited-constructor-padding"
blocked-by: null
closed-reason: null
---

## Context

trails#10317 moved `pg` out of the nested `packages/activerecord/lib/pg` api-compare package into `packages/pg`. To keep the not-yet-moved files (`connection.ts`, `result.ts`, `coder.ts`, `pg.ts`, the array coders) from scoring as activerecord surface, it added `UNSCORED_SUBDIRS = { activerecord: ["pg"] }` in `scripts/api-compare/config.ts`. `overlappingSubDirs` reads it. Without it, activerecord's extra surface jumped from 0 to 69, and connection.ts's former module-local `raise` helper added 386 `raise` call-mismatch rows.

`UNSCORED_SUBDIRS` is tooling debt with one entry. It should disappear once the RFC 0186 move stories (`pg-result-moves-to-the-package`, `pg-array-coders-move-to-the-package`, the three `pg-connection-*-moves-to-the-package` stories, `pg-text-decoders-move-to-the-package`) have emptied `packages/activerecord/lib/pg`.

## Acceptance criteria

- [ ] `packages/activerecord/lib/pg/` no longer exists. Every file in it has moved into `packages/pg/lib/`.
- [ ] `UNSCORED_SUBDIRS` and its use in `overlappingSubDirs` are deleted, and the `extract-ts-api.test.ts` "sub-package de-overlap" expectation drops `path.join(packageSrcDir("activerecord"), "pg")`.
- [ ] `pnpm parity:api:extra:gate`, `lint-call-mismatches.ts` and `parity:api:calls:args` are green.
