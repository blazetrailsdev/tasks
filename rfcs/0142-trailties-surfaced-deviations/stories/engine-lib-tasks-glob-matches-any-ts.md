---
title: "Engine lib/tasks glob loads any .ts/.js, where Rails globs only *.rake"
status: draft
updated: 2026-11-09
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' engine paths add `lib/tasks` with `glob: "**/*.rake"`
(`vendor/rails/v8.0.2/railties/lib/rails/engine/configuration.rb:93`), and
railties keeps its own task files at `railties/lib/rails/tasks/*.rake`, so a
gem's own task sources never sit at `<root>/lib/tasks`. trails uses
`glob: "**/*.{ts,js}"` (`packages/trailties/lib/engine/configuration.ts:62`)
and keeps trailties' task modules at `packages/trailties/lib/tasks/*.ts`.
Since RFC 0223 gives packages a `lib/`, any package-shipped engine whose root
holds `lib/tasks/` loads every `.ts`/`.js` there as a Rakefile fragment —
trails#9897 hit this with `ActionCable::Engine` rooted at `packages/trailties`.

## Acceptance criteria

- [ ] The `lib/tasks` glob matches only task files, the Rails `*.rake`
      analogue (e.g. a `*.rake.ts` suffix, decided against the generators that
      emit app tasks), or trailties' task modules move to the Rails path
      `lib/rails/tasks/` per `PATH_SEGMENT_ALIASES`.
- [ ] A test asserts an engine rooted at a package with non-task modules in
      `lib/tasks` loads none of them.
