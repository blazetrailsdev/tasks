---
rfc: "0000-versioned-vendor-layout"
title: "Nest vendored upstream sources under a version directory"
status: draft
created: 2026-09-25
updated: 2026-09-25
owner: "@deanmarano"
packages:
  - activerecord
  - activesupport
  - activemodel
  - actionpack
  - actionview
  - arel
  - rack
  - rack-session
  - rack-test
  - ruby-compat
  - trailties
clusters:
  - vendor
  - upgrade-prep
priority: 3
---

# RFC 0000 — Nest vendored upstream sources under a version directory

## Summary

`vendor/<source>/` holds one clone of each upstream Ruby source at one pinned ref,
and the ref appears nowhere in the path: `vendor/rails/` is Rails 8.0.2 only
because `vendor/sources.lock.json` says so. Nest each clone one level deeper —
`vendor/rails/v8.0.2/activerecord/lib/...`, `vendor/ruby/v3.3.11/vm_method.c` —
let several versions of one source sit side by side, and rewrite every vendor
citation in the repo to name the version it was verified against.

This is **upgrade preparation, not the upgrade.** Its output is the ability to
fetch Rails 8.1 next to 8.0.2, diff the two trees, and see at a glance which of
trails' ~1,500 citations point at a body nobody has re-verified. It does not bump
any ref.

## Motivation

- **There is no way to start an upgrade.** Bumping `ref` in `vendor/sources.ts`
  replaces the tree in place. The old bodies are gone the moment the new ones
  arrive, so a port cannot be diffed against the version it was written from, and
  `pnpm parity:api` reports the whole delta at once with nothing to attribute it to.
- **A citation is undated.** 1,546 citations across 184 tracked files name
  `vendor/rails/activerecord/lib/...` or `vendor/ruby/vm_method.c:2864` with no
  version. `packages/ruby-compat/src` alone holds 107 of those files and 1,363 of
  the `vendor/ruby/` occurrences. After a bump, every one of them silently means a
  different file, and nothing distinguishes a citation re-verified against the new
  source from one that was never looked at.
- **The path already lies once.** `vendor/ruby/` is MRI `v3_3_11`, a different
  release cadence from Rails' `v8.0.2`, and the two are indistinguishable in a
  path.
- **The resolver is already central,** so the mechanism is cheap:
  `resolvePath` / `vendoredRoot` / `libPathsManifest` / `testPathsManifest` /
  `libEntryFilesManifest` in `vendor/sources.ts` and `destFor` in
  `vendor/fetch.ts` are the only places that join `VENDOR_DIR` to a source name.
  Every script reaches the tree through `pnpm vendor:fetch --print-*-paths`.

## Design

1. **`vendor/<source>/<versionDir>/` is the clone root.** `versionDir` is derived
   from the lockfile's `ref` for that source, normalized: `v8.0.2` stays,
   `v3_3_11` becomes `v3.3.11` (Open question 1). `destFor` and the five
   `vendor/sources.ts` resolvers gain the segment; no caller changes, because they
   all read a resolved absolute path.
2. **Several versions coexist.** `vendor:fetch` fetches the **active** version
   (the lockfile's) and leaves any other version directory alone.
   `vendor:fetch --source rails --ref v8.1.0` clones a second version beside it
   without touching the lockfile; `vendor:fetch --prune` removes every inactive
   one. `--print-paths` and the manifests always answer the active version, so no
   gate or comparer can accidentally read the candidate tree.
3. **Citations name the version.** Every `vendor/<source>/…` string in a JSDoc
   `Mirrors:` line, a comment, a doc, a script or a test becomes
   `vendor/<source>/<versionDir>/…`.
4. **One codemod does the rewrite, now and at every bump.**
   `pnpm vendor:recite` rewrites every tracked citation from whatever version it
   names to the active one, and is the tool the initial sweep and every future
   upgrade both run. The bulk rewrite is not a hand edit.
5. **A gate keeps it true.** A `scripts/` test fails on a tracked citation whose
   version segment is missing, or names a version that is not the active one — so
   an unversioned citation cannot land, and after a bump the sweep is not optional.
6. **`rails:find` prints versioned paths,** since its output is what agents paste
   into the citations the gate then checks.

## Non-goals

- Bumping any `ref`. Rails 8.1 is a separate RFC that *uses* this one.
- Vendoring more sources, or changing which directories a source exposes.
- Committing the clones. They stay gitignored (`.prettierignore`'s `vendor/*/`
  becomes `vendor/*/*/`; ci.yml's cache `path: vendor/*/` follows).
- Any parity-gate semantics. The comparers see the same tree at a deeper path.

## Alternatives considered

- **Leave citations unversioned and add a stable `vendor/rails/current` symlink.**
  Zero sweep now and at every bump, and paths stay resolvable. Rejected: it keeps
  the property this RFC exists to remove — a citation that cannot say which Rails
  it was verified against, so an upgrade has no per-citation worklist.
- **Rewrite citations to `vendor/<source>/current/…`.** The sweep happens once and
  never again. Rejected for the same reason: `current` is the undated path with
  extra characters.
- **Pin citations by SHA** (`vendor/rails/3235827585/…`). Exact, but unreadable and
  it does not match the directory a human `cd`s into.
- **Keep one clone and rely on `git -C vendor/rails checkout v8.1.0` for the diff.**
  No layout change at all, but the tree can then be at a ref the lockfile does not
  name, which is the state `vendor/fetch.ts` deliberately aborts on today, and
  nothing in the repo can hold both versions at once.

## Rollout

1. **Phase 1 — layout:** `nest-vendored-clones-under-a-version-directory`.
2. **Phase 2 — coexistence:** `fetch-a-candidate-version-beside-the-active-one`.
3. **Phase 3 — codemod:** `vendor-recite-rewrites-citations-to-the-active-version`.
4. **Phase 4 — sweeps, parallel after Phase 3:**
   - `recite-ruby-compat-citations-{a-f,g-m,n-z}-against-mri-v3-3-11` (the
     1,266-line MRI half, split three ways by file basename to stay under the
     per-PR ceiling)
   - `recite-rails-and-gem-citations-outside-ruby-compat`
5. **Phase 5 — keep it true:** `gate-unversioned-and-stale-vendor-citations`,
   `rails-find-prints-versioned-paths`.
6. **Phase 6 — the point:** `document-the-upstream-upgrade-procedure`.

## Verification

- `pnpm vendor:fetch` on a clean checkout produces `vendor/rails/v8.0.2/` and ten
  siblings, and `pnpm parity:api` / `parity:test` / `parity:fixtures` /
  `parity:schema` deltas are all zero — the trees are identical, only deeper.
- `scripts/start-worktree.sh` on a fresh worktree symlinks the versioned clones
  and re-clones nothing.
- With `v8.0.2` and a candidate both on disk, every `--print-*-paths` manifest
  answers `v8.0.2`.
- The citation gate is red on a deliberately unversioned citation and on one
  naming a non-active version.
- `pnpm vendor:recite` is idempotent: a second run is a no-op diff.

## Open questions

1. **Normalize the version directory name, or use the ref verbatim?** MRI's ref is
   the tag `v3_3_11`. Recommendation: normalize to `v3.3.11` — the directory is
   read by humans far more often than it is matched against a tag, and the
   normalization is one function with a test. The lockfile keeps the verbatim ref.
2. **Is a stale citation red or merely reported?** Recommendation: red, scoped per
   source — that is what turns an upgrade into a finite, attributable worklist.
   The risk is that the Rails 8.1 PR then carries a ~1,500-line mechanical diff;
   mitigated by the codemod, and by the sweep being its own commit.
3. **Does a `current` symlink ship anyway, alongside versioned citations?** It
   costs nothing and makes a hand-typed path work. Recommendation: no — a second
   spelling of the same tree is a second thing to keep honest, and the gate would
   have to exempt it.
4. **Disk cost of coexistence.** ~53 MiB per source clone. Recommendation:
   `--prune` plus a line in the upgrade doc; no automatic GC.

## Changelog

- 2026-09-25: initial draft.
