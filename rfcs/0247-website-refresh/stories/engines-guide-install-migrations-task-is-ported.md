---
title: "Engines guide: use the ported <engine>:install:migrations task"
status: in-progress
updated: 2026-11-22
rfc: "0247-website-refresh"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: trails#10535
claim: "2026-11-22T00:20:33Z"
assignee: "engines-guide-install-migrations-task-is-ported"
blocked-by: null
closed-reason: null
---

## Context

`packages/website/docs/guides/engines.md` § "Engine Setup" (trails#10510) says
`railties:install:migrations` is not ported and tells readers to copy
migrations by hand. That is wrong: `railties:install:migrations` is defined at
`packages/activerecord/lib/trailties/databases.ts:730`, and each engine with
migrations defines `<railtieName>:install:migrations` at
`packages/trailties/lib/engine.ts:548-562`, mirroring
`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:662-676`.

## Acceptance criteria

- [ ] "Engine Setup" shows `pnpm trails blorgh:install:migrations` then `pnpm trails db:migrate`, and drops the "not ported yet" sentence.
