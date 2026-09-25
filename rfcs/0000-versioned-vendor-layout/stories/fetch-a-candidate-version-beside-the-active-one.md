---
title: "Fetch a candidate version beside the active one"
status: ready
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: [nest-vendored-clones-under-a-version-directory]
deps-rfc: []
est-loc: 160
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/fetch.ts` assumes one clone per source. `--refresh` does
`rmSync(dest, { recursive: true })` (`:89-91`, `:132`), and the fetcher aborts
rather than silently re-fetch when the clone HEAD does not match
`vendor/sources.lock.json` (the reason the CI cache is exact-match only,
`.github/workflows/ci.yml:1600-1605`). With the version segment in place, a second
version is just a sibling directory, which is what makes an upgrade diffable —
the whole point of the RFC.

## Acceptance criteria

- `pnpm vendor:fetch --source <name> --ref <ref>` clones that ref into its own
  version directory beside the active one, without touching
  `vendor/sources.lock.json` and without deleting any existing version.
- `pnpm vendor:fetch` with no `--ref` fetches only the active version and leaves
  inactive version directories untouched (no implicit prune).
- `--refresh` is scoped to the version it is fetching, never the whole
  `vendor/<name>/` tree.
- `pnpm vendor:fetch --prune` removes every inactive version directory, reports
  what it removed, and is a no-op when there are none.
- `--print-paths`, `--print-lib-paths`, `--print-test-paths` and
  `--print-lib-entry-files` answer the **active** version only, with a test that a
  candidate on disk does not change their output — no comparer or gate may read a
  candidate tree.
- The HEAD-vs-lockfile abort still fires for the active version.
