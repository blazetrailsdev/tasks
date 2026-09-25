---
rfc: "0000-versioned-vendor-layout"
title: "Nest vendored upstream sources under a version directory"
status: active
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

<!-- Unnumbered until merge: `rfc:` stays 0000-versioned-vendor-layout and the H1
     below stays number-free. `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Nest vendored upstream sources under a version directory

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
- **Twelve scripts bypass the registry and hardcode the path,** so the layout
  cannot move without them. `scripts/rails-find/core.ts:37-78` holds 27 literals
  (two package→path maps plus `GREP_SCOPE`), and
  `scripts/api-compare/ar-closure.ts:124,128`,
  `scripts/build-rails-error-manifest.ts:93`,
  `scripts/fixtures-compare/compare.ts:20`,
  `scripts/fixtures-compare/extract-ruby-models.rb:10,11,144`,
  `scripts/generate-fixture-parity-map.ts:34`,
  `scripts/schema-compare/compare.ts:46` and
  `scripts/test-deps/rails-test-deps.ts:23` each build their own
  `path.join(ROOT, "vendor/rails", …)`. Each is a second spelling of what
  `vendor/sources.ts` already answers, and each breaks at the depth change —
  before any citation is touched.
- **The resolver is otherwise central,** so the rest of the mechanism is cheap:
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
5. **A citation is not the same as code that matches one.**
   `eslint/ruby-compat-needs-mri-citation.mjs:36` matches citations with
   `/vendor\/ruby\/([A-Za-z0-9_./+-]+):(\d+)/g` and _resolves_ each one against
   the clone — it reports a cited file the pinned checkout does not contain and a
   line past the file's end (`:167-169`). Its character class admits `.` and `/`,
   so a versioned citation matches with `rel = "v3.3.11/rational.c"` and
   resolution silently fails against every ruby-compat export. The rule, its
   fixtures (`ruby-compat-needs-mri-citation.test.mjs:31`) and
   `scripts/api-compare/jsdoc-tag-line.test.ts:78` are logic, not prose, and the
   codemod must not touch them.
6. **A gate keeps it true.** A `scripts/` test fails on a tracked citation whose
   version segment is missing, or names a version that is not the active one — so
   an unversioned citation cannot land, and after a bump the sweep is not optional.
7. **`rails:find` prints versioned paths,** since its output is what agents paste
   into the citations the gate then checks.

## Relationship to RFC 0025 (body pins)

`scripts/api-compare/body-pins.ts` already answers a neighbouring question: it
pins the normalized Rails body digest per name-matched pair, so a bump turns a
changed upstream body into a DRIFT report (`lint-body-pins.ts`, run as the
"Body-pins gate" CI step). The two do not overlap and neither replaces the other:

|             | body pins                                                             | versioned citations                                             |
| ----------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| Granularity | one matched method pair                                               | any path, at a line                                             |
| Detects     | the Ruby body _changed_                                               | the path names a _different version_                            |
| Covers      | `parity:api`-matched pairs only                                       | unmatched surface, comments, docs, MRI C, test schema, fixtures |
| State today | `body-pins.json` is `[]` — ORGANIC policy, `--pin-all` floor deferred | 1,546 citations, none versioned                                 |

Body pins are the precise instrument and citations are the coverage. The gap this
RFC closes for RFC 0025 is that **the pin floor was deferred and the tree it would
pin against is about to move**, so pinning the current surface is itself
upgrade prep — story `pin-the-body-hash-floor-before-the-first-bump`.

## Non-goals

- Bumping any `ref`. Rails 8.1 is a separate RFC that _uses_ this one.
- Vendoring more sources, or changing which directories a source exposes.
- Committing the clones. They stay gitignored: `vendor/.gitignore` is `*` plus an
  allowlist of the tracked registry files, which is depth-independent and needs no
  change. `.prettierignore`'s `vendor/*/` becomes `vendor/*/*/` and ci.yml's cache
  `path: vendor/*/` follows, because those two are globs rather than an allowlist.
  `scripts/parity/legacy-script-names.ts:87`'s `path.join("vendor", "rails")` skip
  is a prefix and keeps working.
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

1. **Phase 0 — one resolver:** `route-vendor-path-construction-through-sources-ts`.
   Nothing else can move until the twelve bypassing scripts read the registry.
2. **Phase 1 — layout:** `nest-vendored-clones-under-a-version-directory`.
3. **Phase 2, in parallel:**
   - `fetch-a-candidate-version-beside-the-active-one` (coexistence)
   - `version-the-mri-citation-lint-and-its-resolver` (the eslint rule, which must
     accept the versioned form before any ruby-compat sweep lands)
   - `pin-the-body-hash-floor-before-the-first-bump` (independent of the layout)
4. **Phase 3 — codemod:** `vendor-recite-rewrites-citations-to-the-active-version`.
5. **Phase 4 — sweeps, parallel, disjoint files:**
   - `recite-ruby-compat-citations-{a-f,g-m,n-z}-against-mri-v3-3-11` (the
     1,266-line MRI half, split three ways by file basename to stay under the
     per-PR ceiling)
   - `recite-rails-and-gem-citations-outside-ruby-compat`
6. **Phase 5 — keep it true:** `gate-unversioned-and-stale-vendor-citations`.
7. **Phase 6 — the point:** `document-the-upstream-upgrade-procedure`.

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
- `pnpm lint` is clean after each sweep — in particular
  `blazetrailsdev/ruby-compat-needs-mri-citation` still _resolves_ every rewritten
  MRI citation to an existing file and an in-range line, which is the arm the
  version segment would otherwise break silently.
- `pnpm tsx scripts/api-compare/lint-body-pins.ts` is green with a non-empty
  `body-pins.json`, and reports DRIFT (not STALE) when pointed at a candidate tree.
- `git grep -n 'vendor/rails"' -- scripts eslint` returns nothing: no script
  rebuilds a vendor path outside `vendor/sources.ts`.

## Open questions

All five are resolved; the RFC is `active`. Each resolution is an instruction to
the story that implements it, not a preference to re-litigate there.

1. **Normalize the version directory name, or use the ref verbatim?**
   **Resolved: normalize.** MRI's ref is the tag `v3_3_11`; the directory is
   `v3.3.11`. The directory is read by humans far more often than it is matched
   against a tag, the normalization is one function with a test, and
   `vendor/sources.lock.json` keeps the verbatim ref as the fetch input.
2. **Is a stale citation red or merely reported?**
   **Resolved: red, per source.** That is what turns a bump into a finite,
   attributable worklist, and it is the whole reason citations carry a version at
   all. Consequence accepted: the Rails 8.1 PR carries a ~1,500-line mechanical
   commit, produced by `pnpm vendor:recite` and committed separately from any
   hand-written change.
3. **Does a `current` symlink ship anyway, alongside versioned citations?**
   **Resolved: no.** A second spelling of the same tree is a second thing to keep
   honest, and the citation gate would have to exempt it — which would also exempt
   an unversioned citation that happens to resolve.
4. **Does the citation gate subsume `ruby-compat-needs-mri-citation`'s resolve arm?**
   **Resolved: it sits beside it.** The eslint rule resolves a citation to a real
   file and an in-range line, needs a fetched tree, and runs in the
   `rails-comparison` job; the gate checks the version segment for all eleven
   sources from the lockfile alone and must pass in Unit Tests, which has no
   `vendor/`. The overlap on ruby-compat's version segment is intentional
   redundancy.
5. **Disk cost of coexistence.** **Resolved: manual `--prune`, no automatic GC.**
   ~53 MiB per clone, and a candidate is present only during an upgrade. An
   automatic prune would delete the tree the upgrade is diffing against, which is
   the one thing coexistence exists to prevent.

## Changelog

- 2026-09-25: initial draft.
- 2026-09-25: all five open questions resolved; status draft → active.
- 2026-09-25: analysis pass. Added Phase 0 (twelve scripts rebuild the vendor path
  from a literal and break before any sweep), the MRI-citation lint story (its
  `CITATION` regex silently mis-resolves a versioned path), the body-hash floor
  story, and the RFC 0025 relationship section. Dropped
  `rails-find-prints-versioned-paths` — its 27 literals are path construction, so
  Phase 0 covers them. Recorded `vendor/.gitignore` as depth-independent.
