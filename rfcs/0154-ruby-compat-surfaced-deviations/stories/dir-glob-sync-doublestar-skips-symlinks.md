---
title: "dir-glob-sync-doublestar-skips-symlinks"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
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

# Sync Dir.glob's \*\* follows symlinks under FNM_DOTMATCH

## Context

`glob_helper` never descends a symlinked directory through `**` (`vendor/ruby/v3.3.11/dir.c:2759`).
`globHelperAsync` in `packages/ruby-compat/lib/dir.ts` honours this; the sync `globHelper`'s `**`
branch tests `File.isDirectory(join(name))`, which follows a symlink, so `Dir.glob("**/*", ...)`
descends into a symlinked directory where Ruby does not.

## Acceptance criteria

- Sync `globHelper`'s `**` recursion skips a symlinked directory, as `globHelperAsync` does.
- A `dir.trails.test.ts` case with a symlinked directory pins it, verified against ruby 3.3.11.
