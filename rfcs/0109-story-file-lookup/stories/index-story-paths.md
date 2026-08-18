---
title: "Derive story_paths into the index"
status: done
updated: 2026-08-18
rfc: "0109-story-file-lookup"
cluster: file-lookup
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 0
pr: 68
claim: "2026-08-18T14:36:27Z"
assignee: "index-story-paths"
blocked-by: null
---

## Context

Story bodies already cite the trails files they concern — 1,075 of the 1,198
open stories (90%) name at least one `packages/…` or `scripts/…` path, resolving
to 770 distinct files. Nothing reads them. This story extracts those paths at
index-build time so the query in `tasks-touching-command` has something to
consume.

The extractor must live in `scripts/lib.mjs`: `scripts/build-index.mjs` is ESM
JavaScript and cannot import `scripts/cli.ts`, and `loadAll()`
(`scripts/lib.mjs:50`) already returns each story's `body`, so no loader change
is needed. `scripts/cli.ts` never needs the extractor — it reads `story_paths`
back out of `index.json`.

Two registrations are load-bearing and silently no-op if missed:

- **`READ_INDEX_CACHE_VERSION` (`scripts/cli.ts:200`) must go `"v2"` → `"v3"`.**
  Read commands serve an index built from the origin/main tree, cached per
  commit sha as `<sha>.<version>.json` (`scripts/cli.ts:261`). Every existing
  entry predates `story_paths`, so without the bump the new field reads as
  absent for any already-cached sha and the feature looks broken.
- **A new `.mjs` test file must be registered in `package.json`.** The vitest
  config collects only `scripts/**/*.test.ts`, so an `.mjs` test is never picked
  up. `scripts/validate-lib.test.mjs` is the precedent: it runs because
  `package.json`'s `test` script invokes it directly.

## Acceptance criteria

- [ ] `extractStoryPaths(body)` added to `scripts/lib.mjs`, matching
      `(packages|scripts)/<path>.(ts|tsx|mjs|js)`, excluding any path containing
      `vendor/` (those are Rails anchors, not trails work surface).
- [ ] Output is deduped, sorted, and capped at 20 entries — `index.json` must
      rebuild byte-identically for a given tree, because the read path caches it
      by commit sha. Measured over all 6,202 stories: median 1 path, p90 3,
      p99 6, max 31, and only **4 stories (0.06%) exceed 20** — the cap bounds a
      pathological body without truncating real data.
- [ ] `scripts/build-index.mjs` emits `story_paths` on each story record
      (`:70-95`) and appends the paths to the `search.json` story `terms`
      (`:117-119`).
- [ ] `StoryEntry` in `scripts/cli.ts` (`:147-172`) gains
      `story_paths?: string[]` — optional, matching the `raw_status?` /
      `packages?` precedent, so an older `index.json` still parses.
- [ ] `READ_INDEX_CACHE_VERSION` bumped to `"v3"`.
- [ ] `scripts/lib.test.mjs` added AND registered in `package.json`'s `test`
      script alongside `scripts/validate-lib.test.mjs`.
- [ ] `scripts/cli.test.ts` `story()` fixture (`:125`) gains `story_paths: []`.

## Definition of done

Adding a `files:` frontmatter key does not close this story — the whole point is
that the data is derived from the body, never authored. A test file that exists
but is not wired into `package.json` does not close it either: unregistered
`.mjs` tests never run.

## Verification

```bash
pnpm build-index && node -e 'const i=require("./index.json");
const n=i.stories.filter(s=>s.story_paths?.length).length;
console.log(n, "of", i.stories.length, "stories carry paths")'
pnpm test        # includes the newly registered lib.test.mjs
pnpm verify      # index.md unchanged — story_paths lands in gitignored caches only
```

Expect roughly 90% of open stories to carry at least one path.

## Notes

Cases worth covering in `lib.test.mjs`: a backticked path inside a `## Context`
bullet; a path with a trailing `:line` citation; a `vendor/rails/...` path
(excluded); the same path cited twice (deduped); a body with no paths (`[]`); a
body with more than 20 (capped); stable ordering across runs.

**Citations are line-accurate as of tasks `def67d896`.** Anchor on the symbol
names — `loadAll()`, `READ_INDEX_CACHE_VERSION`, `StoryEntry`, the `story()`
fixture — rather than the line numbers. This RFC's own first draft was authored
against a tree 319 commits behind main and every number in it had drifted; the
same will happen here before the story is claimed.
