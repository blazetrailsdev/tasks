---
rfc: "0097-parity-output-sharding"
title: "Per-source-file sharding for parity registers and artifacts"
status: draft
created: 2026-08-10
updated: 2026-08-10
owner: "@deanmarano"
packages: []
clusters:
  - "api-compare"
related-rfcs:
  - "0047"
  - "0083"
  - "0084"
  - "0092"
  - "0095"
---

# RFC 0097 — Per-source-file sharding for parity registers and artifacts

## Summary

Every parity register and every generated parity artifact that is **keyed by a
source file** is stored as one JSON file per source file, in a tree that mirrors
the source tree:

```text
<tree-root>/<package>/<source path, extension replaced by .json>
```

This is already the shape of `scripts/api-compare/call-mismatches-exclude/`,
`call-mismatches-wide-exclude/`, and `call-mismatches-unreviewed/`, and the
mechanism that implements it (`relPathFor`, `loadSplitBaseline`,
`writeSplitBaseline`) already lives in
`scripts/api-compare/lint-call-mismatches.ts`. This RFC does three things:

1. **Extracts that mechanism** into `scripts/parity/` as one shared helper, and
   migrates the three existing api-compare trees onto it, so there is one
   implementation rather than six copies.
2. **Migrates the remaining shardable registers** — `arity-exclude.json`,
   `inheritance-exclude.json`, `body-pins.json` — onto that helper.
3. **Shards the generated `output/` artifacts** of `api-compare` and
   `test-compare` on the same convention. (`schema-compare` has no `output/`
   tree — its only persisted state is the committed `invented-baseline.json`,
   dispositioned below.)

It also **names, explicitly, the registers that are not keyed by a source file**
and records the decision not to shard them. Forcing a mirrored tree onto data
that has no per-source-file grain is worse than the monolith it replaces; the
disposition section below is a normative part of this RFC, not commentary.

## Motivation

The two halves have **different motives**, and the RFC keeps them apart on
purpose — one rationale must not be copy-pasted onto the other.

### Committed registers: merge conflicts and reviewable diffs

The registers are edited by many agents in parallel, one story each. A
monolithic sorted JSON array means that two agents converging divergence in two
_unrelated_ source files rewrite adjacent regions of the same file and conflict
on rebase. Worse, the conflict is silent-ish: `git` resolves some of them by
taking both hunks, and a mis-merged only-shrink baseline reappears as a STALE
row on a third agent's branch that never touched the code.

The reviewability half matters as much. CI's baseline-drift step
(`.github/workflows/ci.yml:1452-1469`) prints `git diff` of the register as the
error message. Against a monolith that diff is "the whole file reordered".
Against the sharded tree it is the two or three files the branch actually
touched, and the reviewer can read it.

The evidence that this works is `call-mismatches-exclude/`: **400 files** today,
with `call-mismatches-unreviewed/` at **356**, and both have carried
high-parallelism traffic since RFC 0083/0084 without the conflict class the
monolith produced.

### Generated artifacts: diffability, incremental reads, and blast radius

The `output/` trees are gitignored (`.gitignore:4-6`), so **merge conflicts are
not the motive here and must not be cited as one.** The motives are:

- **Diffability.** `api-comparison.json` and friends are the primary debugging
  surface when a gate moves. Diffing two runs of a ~55MB single-document blob
  is not a thing a human does; diffing `output/api-comparison/activerecord/relation/query-methods.json`
  between two runs is trivial.
- **Reading one file's result.** Today, answering "what did the comparator say
  about `relation/calculations.ts`?" requires parsing the whole artifact.
- **Incremental regeneration** — see the explicit scope limit below.

## The path convention

Stated once, normatively.

A register or artifact is **shardable** iff each of its rows carries a
`package` field and a source-file field naming a file under that package (or
under the vendored Rails gem for that package). For such a row, its shard path
relative to the tree root is:

```text
<row.package>/<row.<sourceField>  with its source extension replaced by ".json">
```

- The source extension is `.ts` for TS-keyed registers and `.rb` for Ruby-keyed
  ones. **This RFC generalizes the existing `relPathFor`
  (`lint-call-mismatches.ts:169`), which hardcodes `.ts`**: three of the
  registers being migrated (`arity-exclude`, `inheritance-exclude`,
  `body-pins`) key on `rubyFile`, not `tsFile`
  (`arity-exclude.ts:7,25-29`; `inheritance-exclude.ts:12`;
  `body-pins.ts:86-99`, and see the note at `body-pins.ts:168` recording that
  the call-gate helper "cannot be reused directly" for exactly this reason —
  that note is what this RFC retires). Each tree declares its expected source
  extension once; the helper takes it as a parameter.
- **A source path that does not end in the declared extension is a hard
  throw**, not a silent write. This guard (`lint-call-mismatches.ts:170-177`)
  is load-bearing and every tree inherits it: a shard written with any other
  extension would be skipped by the `.json` reload glob, which is silent
  round-trip data loss rather than a loud failure.
- Directory separators in the source path become directory separators in the
  tree. No flattening, no hashing, no escaping. The tree is browsable and
  `ls`-able alongside the sources it mirrors.
- Nothing else appears in the tree. No index file, no manifest, no `_meta.json`
  — the glob over `**/*.json` is the index.

### Precedent under a different key

`scripts/parity/pipeline/fixtures/*/expected.json` is already one file per
fixture — the same convention keyed on fixture id instead of source path. It is
cited here as precedent and is **out of scope**; do not touch it.

## The correctness contract

**Merged-load behaviour must be identical in effect to the monolith's.** This
is the single acceptance criterion every migration story restates.

Concretely, the loader concatenates every per-file array under the tree into
one list and sorts it into the register's canonical order — `loadSplitBaseline`
(`lint-call-mismatches.ts:203-209`) — and _then_ every guard runs across the
merged set:

- **Duplicate-key** detection sees a duplicate that spans two shards exactly as
  it saw one that spanned two array positions.
- **Partial-scope** guards (the `--package` filter / unfetched-gem signature
  check, e.g. `body-pins.ts:105-111`) evaluate against the merged set.
- **Only-shrink** and **stale-row** checks compare merged-before to
  merged-after. A row is stale for the same reason and reports the same message.
- **Unknown-package** validation (`arity-exclude.ts:64-69`) still runs; note
  that after sharding, the package is also encoded in the path, so the
  validator must check that the row's `package` field agrees with its shard's
  directory. A disagreement is a throw.

A migration story is not done unless it demonstrates this: the existing
register's own test file must pass unchanged against the sharded tree, and each
story adds a test that a divergence spanning two shards is reported identically
to one within a single shard.

## One shared helper

The helper lives in **`scripts/parity/`**, the established shared home for
cross-tool parity code (`conventions.ts`, `shared-cache.ts`,
`write-json-manifest.ts`, `types.ts`), and is imported by api-compare and
test-compare alike. It is added to the
`@blazetrails/parity` subpath surface those tools already import from
(`lint-call-mismatches.ts` imports `@blazetrails/parity/conventions` and
`@blazetrails/parity/types` today).

Its surface, in one module:

- `shardPath(row, { sourceField, extension })` — the path convention plus the
  extension throw. Generalizes `relPathFor` (`:169`).
- `loadSharded(dir, compare)` — glob, concatenate, sort. Generalizes
  `loadSplitBaseline` (`:203`).
- `writeSharded(rows, dir, opts)` — repartition, `mkdir -p`, write through the
  register's serializer, delete shards that converged to zero, prune emptied
  directories. Generalizes `writeSplitBaseline` (`:216-245`).

The api-compare copies are **deleted and re-exported from the shared helper**,
not left in place alongside it. `relPathFor` and `loadSplitBaseline` are
imported by name from `build.ts` (`:43-45`), `lint-call-mismatches.test.ts:364`,
and `baseline-json.test.ts:107`; those imports move to the shared module in the
same story that extracts it.

**Extracting the helper is the first story and everything else depends on it.**

## Writer discipline

Unchanged by this RFC, and restated because sharding multiplies the number of
files a careless writer can churn:

- **`serializeBaseline` (`scripts/api-compare/baseline-json.ts`) is the only
  writer** for committed registers. A naive `JSON.stringify`/`json.dumps`
  escapes non-ASCII punctuation such as em-dashes and reds Unit Tests. Every
  shard in every tree goes through it. Generated artifacts, which are not
  prettier-checked, may use the plain writer; committed trees may not.
- **Canonical row order within a shard** is the register's existing comparator
  (`compareKeys` for the call gate; each register's own `keyOf` ordering
  otherwise). A shard is sorted independently; the merged load re-sorts, so the
  two agree.
- **Never `--write`/reseed to fix one stale row.** A reseed rewrites the whole
  tree and buries the intended change in an unreviewable diff. Delete the stale
  shard row by hand. This is the existing rule
  (`scripts/parity/README.md:59-62`) and sharding makes it easier to obey, not
  optional.

## Empty-file policy

**A source file with zero rows gets no file at all.** `writeSplitBaseline`
already deletes a shard whose entries all converged and prunes the directories
that emptied, "never leaving a `[]`" (`lint-call-mismatches.ts:216-245`).

Consequence, stated so nobody later mistakes the tree for something it is not:
**the tree indexes flagged source files, not compared source files.** The
absence of `<tree>/activerecord/relation.json` means "no rows", which conflates
"compared and clean" with "not compared at all". Anything needing the compared
population reads the artifact, which carries the compared set explicitly (e.g.
`artifact.packages`, `body-pins.ts:109`).

Justification for choosing this over `[]`-everywhere: an `[]`-everywhere policy
would create ~2,000 committed files whose entire content is two bytes, would
make "did this branch converge anything?" invisible in `git diff --stat`, and
would require every register to know the full compared population at write time
— which a `--package`-scoped run does not have, so it would either write a
partial index or delete other packages' placeholders. The only-flagged policy
has none of those failure modes and is what already ships.

## Directory-not-file migration: git history and registrations

Replacing `foo.json` with `foo/` is a delete plus N adds. `git log --follow`
does not track it and neither does `git blame`. That loss is accepted: the row
provenance that matters is the `reason` string in the row itself, which
survives verbatim. Each migration story records the pre-migration file's last
commit sha in its PR body so the history is one `git log <sha> -- <path>` away.

Per tree, the migration must check and update **all** of:

- **`.gitignore`** — for generated trees. `scripts/api-compare/output/` and
  `scripts/test-compare/output/` are already ignored as directories
  (`.gitignore:4-6`), so sharding _inside_ them needs no change — verify rather
  than assume, and state the result in the PR body.
- **CI workflow steps** that name the path. Grep `.github/workflows/ci.yml` for
  the file name. The call-gate drift step
  (`ci.yml:1452-1469`) is the model: it must `git add --intent-to-add` the tree
  before `git diff`, because **untracked new shards are invisible to `git diff`
  and the drift check silently passes without it** (that comment at
  `ci.yml:1458-1460` is a scar; every sharded committed tree needs the same
  treatment).
- **The `INFRA_CARVEOUT_RE` / `UNIT_TESTS_PKGS_RE` path filters**
  (`ci.yml:107`, `:116`) — these are directory-prefixed regexes over
  `scripts/…/`, so a file→directory change inside an already-matched directory
  is fine. `scripts/non-transactional-row-writes.json` is matched by an
  explicit _file_ pattern in `UNIT_TESTS_PKGS_RE`; anything moving out of a
  top-level file must update it.
- **`scripts/api-compare/build.ts`** — `build.ts:69` constructs `BASELINE_DIR`
  from `"call-mismatches-exclude"` and its header (`:23`) documents that tree as
  the reason source it migrates from. Any register `build.ts` reads needs the
  same directory-form construction. (Note: this is a _path constant_, not a
  registry of tracked inputs — there is no separate tracked-input list to
  update; the header comment at `:15-26` is the documentation to keep true.)
- **`scripts/parity/README.md`** — the register table at `:41-50` marks each
  path `(sharded)` or not. Every migration flips its row, and the "Do not move
  these files" paragraph at `:52-56` must keep naming the right set.
- **`docs/`/`CONTRIBUTING.md` prose** that names the file. Docs-only churn is
  LOC-exempt, so there is no excuse for leaving a stale path in prose.

The **`Rails API/Test Comparison`** CI job is where every one of these gates
runs (`ci.yml:1376-1550`). No new job is added by this RFC; each migration
story verifies its gate still runs and still fails on a seeded divergence.

## Generated artifacts: layout now, incrementality later (and not a second cache)

Sharding the `output/` artifacts is, in this RFC, **a layout change only.**

There is already an incremental layer and this RFC does not compete with it:

- `output/ts-api-cache/<pkg>.json` is the in-tree TS extraction cache, keyed on
  `packageFingerprint` (`extract-ts-api.ts:76-88`).
- `scripts/parity/shared-cache.ts` adds a second, **content-keyed** layer
  anchored at the git common dir so sibling worktrees reuse each other's
  extraction (`shared-cache.ts:1-21`).
- `scripts/api-compare/extractor-schema.ts` supplies the output-schema token
  that busts both when the extractor's emitted shape changes — the PR #4020 trap
  documented at `extractor-schema.ts:6-13`.

Both cache layers are keyed at **package** grain, and the artifacts this RFC
shards at **file** grain sit downstream of them. Splitting the artifact does not
by itself make the extractor recompute less: a one-file source edit still busts
the whole package fingerprint.

Therefore:

- **In scope:** write the artifact as N files instead of one; readers load the
  merged view through `loadSharded`.
- **Explicitly out of scope:** any new cache, any per-file fingerprinting, any
  "skip unchanged shards" write path. If per-file incremental extraction is
  wanted, it belongs in the _existing_ cache layers — a finer key on the
  existing store — and needs its own RFC with its own answer for the
  schema-token bust. **Do not add a second, competing cache under `output/`.**
- One thing sharding _does_ buy immediately and for free: a writer that emits
  identical bytes for an unchanged shard makes "which files moved between two
  runs?" an `ls`-and-`diff` question instead of a JSON-parse question. That is a
  debugging affordance, not a cache.

## Disposition of registers with no per-source-file grain

Normative. Three registers are **not** keyed by source file and this RFC
**declines to shard them**. Each disposition is recorded with its reason so a
later reader does not "finish the job" by sharding them anyway.

### `scripts/schema-compare/invented-baseline.json` — LEAVE MONOLITHIC

Its content is two sorted lists of **database identifiers** (`tables`,
`columns`) — `admin_regions`, `appointments`, … — with no source-file field at
all. There is no path to mirror. Its natural key would be the table name, and a
tree of ~150 two-byte files named after tables mirrors nothing and is strictly
worse than a sorted list.

The conflict pressure sharding exists to relieve is also low here: a sorted
one-identifier-per-line JSON array is close to the best case for git's line
merge, and edits are rare (they track canonical-schema convergence, not
day-to-day porting). Consumed by `schema-compare/compare.ts`.

**Revisit trigger:** if rows ever gain a per-table `reason` string (making them
objects rather than bare strings) and the file starts taking concurrent edits,
shard by table name at that point — not before.

### `scripts/test-compare/assertion-mismatch-mark.json` — LEAVE MONOLITHIC

Its content is **per-package counters**, one small object per package
(`{assertionCount, kind, value}`), read by
`test-compare/lint-assertion-mismatches.ts:43`. Its real key is the package,
and package is already the _coarsest_ level of the sharding convention — there
is no source-file dimension below it.

Sharding by package would produce ~13 files, but would not relieve the actual
conflict: virtually every edit moves the **`activerecord`** counters, so two
concurrent branches would collide inside `activerecord.json` exactly as they
collide inside the monolith today. Sharding buys the appearance of a boundary
without the boundary.

This is the disposition most likely to be overruled — per-package shards are a
legitimate application of the convention and the cost is ~13 tiny files. It is
declined here because it does not move the conflict number, which is the whole
motive for the committed half.

**Revisit trigger:** if the mark ever gains per-file grain (a per-test-file
assertion mark rather than a package counter), it becomes shardable under the
standard convention and should be migrated then.

### `scripts/non-transactional-row-writes.json` — LEAVE MONOLITHIC

This one _is_ keyed by source file — it is a flat array of 9 test file paths
(`packages/activerecord/src/…/*.test.ts`), with `RATCHET_PATH` at
`non-transactional-row-writes.ts:71`. So the convention _applies_, and the
result is degenerate: **the row's entire content is its own path.** Sharding it
yields 9 files each containing `[]`, where the filename carries 100% of the
information and the payload carries none. That is a tree whose every file is
empty, which the empty-file policy above says should not exist at all — the two
rules contradict each other on this register, and the resolution is not to
shard it.

Conflict pressure is also minimal: 9 lines, sorted, one path each, and the
ratchet only shrinks. Two agents each deleting a different line merge cleanly.

**Revisit trigger:** if rows gain a `reason` (which the only-shrink discipline
arguably wants — see `project_row_writes_ratchet_fires_on_base_connectionpool_substring`
for how easily a row is added by accident), shard it under the standard
convention at that time. Note the CI filter caveat: this path is named as an
explicit _file_ in `UNIT_TESTS_PKGS_RE` (`ci.yml:116`) and a future migration
must update that regex.

## Migration order and blast radius

Every gate, lint, and CI step in the `Rails API/Test Comparison` job reads these
files, and sibling agents are mid-flight in them continuously. **PR #6334**
(`feat(parity): call-argument ratchet, per-site weak receivers, naming-dimension
disposition`) is actively touching `call-mismatches-exclude` as this RFC is
written, and RFC 0095 has its own story
(`call-args-rows-share-existing-shards`) that lands rows into the same trees.

Sequencing rules:

1. **`shared-shard-helper` lands first.** It is pure extraction: the three
   existing trees keep their exact on-disk bytes, and the only diff is where the
   functions live. It touches no register content, so it cannot conflict with a
   row-editing sibling — but it _does_ touch `lint-call-mismatches.ts` and
   `build.ts`, so it must not be in flight at the same time as #6334.
   **Every other story in this RFC depends on it.**
2. **The three committed-register migrations** (`arity-exclude`,
   `inheritance-exclude`, `body-pins`) are mutually independent — different
   files, different lints, different CI steps — and may run in parallel with
   each other. Two of them are empty (`body-pins.json`, `inheritance-exclude.json`
   are `[]` today) and one has a single row (`arity-exclude.json`), so their
   content risk is near zero and they are the safest possible exercise of the
   new helper.
3. **The generated-artifact migrations** (api-compare output, test-compare
   output) touch no committed bytes and no baselines, so their blast radius is
   the reader list, not the register list. They may run in parallel with (2) and
   with each other; they must not run in parallel with each other's _shared_
   readers (api-compare's `orchestrate.ts` / `drift.ts` both read `output/`).
4. **`register-table-and-docs`** lands last, after the trees it describes exist.

No two stories in this RFC write the same file. That is a hard scheduling
constraint, not a preference.

## Non-goals

- Changing any register's **content**, semantics, or gate thresholds. A
  migration PR that converges a row, or adds one, is out of scope; the merged
  set before and after must be equal.
- Sharding `scripts/parity/pipeline/fixtures/` (already one-file-per-fixture).
- Any new cache layer (see above).
- Moving registers between directories. Only file→directory at the same path.

## Related RFCs

- **0047** — the call-set ratchet whose baseline is the sharded precedent.
- **0083** — the unreviewed-reason mark, co-sharded on the same boundary
  (`lint-call-mismatches.ts:186-192`); the "one merge-conflict boundary shared
  by sibling trees" goal this RFC generalizes.
- **0084** — folded the RFC 0044 ratchet into 0047's; row count is the debt
  metric.
- **0092** — parity tools consolidation; `scripts/parity/` as the shared home.
- **0095** — call-argument parity; its `call-arg-mismatches.json` artifact and
  its `call-args-rows-share-existing-shards` story land in these trees.
