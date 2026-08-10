---
title: "Shard the ts-api / rails-api / body-hashes extraction manifests"
status: ready
updated: 2026-08-10
rfc: "0097-parity-output-sharding"
cluster: api-compare
packages: []
deps: ["shared-shard-helper"]
deps-rfc: []
est-loc: 380
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The two extraction manifests are the largest single documents in the repo's
tooling and every downstream comparator reads them whole:

- `scripts/api-compare/output/ts-api.json` — written by `extract-ts-api.ts`,
  run at `.github/workflows/ci.yml:1380`.
- `scripts/api-compare/output/rails-api.json` — written by
  `extract-ruby-api.rb`, run at `ci.yml:1376`.
- `scripts/api-compare/output/body-hashes.json` — the per-method body hashes
  `body-pins.ts:67-74` reads (`package`, `rubyFile`, `rubyName`, `tsFile`).

All three are keyed per source file already, in their row shape — `ts-api` by
`tsFile`, `rails-api` and `body-hashes` by `rubyFile`. They are gitignored
(`.gitignore:5`), so **merge conflicts are not the motive**; the motives are
diffability between two runs and being able to read one file's extraction
result without parsing a multi-tens-of-megabytes blob.

Interaction with the existing caches, which this story must **not** duplicate:

- `extract-ts-api.ts:76-88` — the in-tree `output/ts-api-cache/<pkg>.json`
  cache, keyed on `packageFingerprint`.
- `scripts/parity/shared-cache.ts:1-21` — a second, content-keyed layer
  anchored at the git common dir so sibling worktrees reuse each other's work.
- `scripts/api-compare/extractor-schema.ts:1-30` — the output-schema token that
  busts both when the emitted per-method shape changes. The PR #4020 trap
  (`:6-13`): a new field added without bumping the token served stale,
  field-less manifests and the call gate reported the inverse of reality.

Both cache layers are keyed at **package** grain and sit upstream of these
artifacts. Sharding at file grain does not make extraction incremental, and RFC
0097 puts any per-file cache explicitly out of scope.

## Acceptance criteria

1. `ts-api.json`, `rails-api.json`, and `body-hashes.json` are written as
   sharded trees (`output/ts-api/<package>/<tsFile .ts→.json>`, and the
   `.rb→.json` mapping for the two Ruby-keyed ones), using the RFC 0097 shared
   helper's `shardPath` / `writeSharded`.
2. Every reader loads the merged view via `loadSharded` and observes a manifest
   **equal** to today's — same rows, same order after canonical sort. Prove it:
   run the full `parity:api` pipeline before and after and diff the downstream
   comparison artifacts; they must be identical.
3. Rows whose source path lacks the declared extension throw, per the shared
   helper's guard — no silent write.
4. **No new cache.** The story adds no per-file fingerprint, no
   skip-unchanged-shard write path, and no store under `output/`. If the
   extractor-schema token needs a bump because the emitted shape changed, do it
   through `extractor-schema.ts`'s existing mechanism (`EXTRACTOR_OUTPUT_FIELDS`
   - source hashes) — do not work around it.
5. A stale tree from a previous run cannot be half-read: the writer removes
   shards no longer produced (same delete-and-prune discipline as the committed
   trees), so a package that lost a source file does not leave a ghost shard the
   comparator counts.
6. `API_COMPARE_FORCE=1 pnpm parity:api` and a warm-cache run produce the same
   tree.
7. `.gitignore:5` already ignores `scripts/api-compare/output/` as a directory,
   so no change is needed — verify rather than assume, and state the result.
8. `build-freshness.ts` / `orchestrate.ts` / `drift.ts` readers of `output/` are
   updated in step; `drift.ts:28` and `orchestrate.ts:82` each construct their
   own `OUTPUT_DIR`.
