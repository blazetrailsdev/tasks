---
title: "cli-task-names-are-snake-case"
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

`bin/trails active-storage:install` is rejected with "Did you mean? active_storage:install", and
`vite:verify_install` is listed in snake_case. CLAUDE.md § "Casing is translated, never mirrored" (operator
ruling 2026-11-18) makes CLI tokens kebab-case: `active-storage:install`, `vite:verify-install`.

## Acceptance criteria

- Rake/CLI task names a trails app sees are kebab-case; the snake_case spelling is not registered.
