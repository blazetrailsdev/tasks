---
title: "Flip the rails ref to v8.0.5.2: lockfile, seeded ledger, recite, stale deletions, regenerated artifacts"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: flip
packages:
  [
    scripts,
    arel,
    activemodel,
    activerecord,
    activesupport,
    actionpack,
    actionview,
    activejob,
    actioncable,
    actionmailer,
    activestorage,
    actionmailbox,
    actiontext,
    trailties,
  ]
deps:
  [
    retake-the-body-pin-floor-at-the-last-8-0-2-commit,
    bump-dry-run-runs-the-gates-against-a-candidate-ref,
    bump-history-is-recorded-in-the-stats-db,
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 3 "What the flip PR contains", and vendor/README.md § "Upgrading a
source (bumping `ref`)" steps 3 to 5. Target: `rails` `v8.0.5.2`, commit
`235c597b100321b6bd2d62f8df63707f42b25b2d` (`refs/tags/v8.0.5.2^{}`; the tag
object is `3ada6507…`), released 2026-11-04. The slug says `8-0-5-1` because
it predates the retarget and is the story's id. This PR is mechanical
throughout and ports nothing.

The `ref` is `vendor/sources.ts:103` (`ref: "v8.0.2"`). Rails' version
constants are `gem_version.rb` in each gem; at `v8.0.5.2` they read
`MAJOR = 8`, `MINOR = 0`, `TINY = 5`, `PRE = "2"`
(`activerecord/lib/active_record/gem_version.rb:9-15` at that tag), so the
fourth segment is `PRE`. trails ports them in twelve files:
`packages/{actioncable,actionmailer,actiontext,actionview,activejob,activemodel,activestorage,activesupport,trailties}/lib/gem-version.ts`,
`packages/actionpack/lib/action-pack/gem-version.ts`,
`packages/activerecord/src/gem-version.ts` and
`packages/actionmailbox/src/gem-version.ts`, each with `TINY = 2` and
`PRE = null` today (for example `packages/activerecord/src/gem-version.ts:7-10`).

Measured on 2026-10-13 at `v8.0.5.1`: 141 pins DRIFT and 12 go STALE in 82
Ruby files, ten gates red without the ledger, 103 citations in 47 files. On
2026-11-10, `git grep -c 'vendor/rails/v8\.0\.2/'` counts 161 citations in 63
files. The dry run at `v8.0.5.2` gives the current figures.

## Acceptance criteria

One PR from `main`, in separate commits:

- [ ] `pnpm parity:bump:dry-run --source rails --ref v8.0.5.2` is run and its
      report committed under `scripts/parity/bump-ledger/reports/`.
- [ ] `ref: "v8.0.5.2"` at `vendor/sources.ts:103`, and
      `pnpm vendor:fetch --source rails` re-locks `vendor/sources.lock.json`
      to `235c597b100321b6bd2d62f8df63707f42b25b2d`.
- [ ] The ledger for `rails` is seeded from the dry run, and the ledger gate
      confirms the seed. The PR body gives its row count per package and kind.
- [ ] `pnpm vendor:recite --check` is saved before the rewrite and attached
      to `reread-the-recited-rails-citations-against-v8-0-5-1`; then
      `pnpm vendor:recite` in its own commit, and
      `pnpm vitest run scripts/vendor-citations.test.ts` passes.
- [ ] `pnpm parity:api:inlined:fix` rewrites the `@inlinedFrom` spans, and
      `pnpm parity:api:inlined` is green.
- [ ] Rows and receipts the bump makes stale on pairs outside the ledger are
      deleted by hand and the marks tightened with the `:tighten` scripts.
      Those on ledgered pairs are left for the burn-down. No `--write`, no
      reseed.
- [ ] Regenerated and committed: `pnpm rails-privates:manifest`, the
      deprecation manifest, `pnpm parity:api:conventions`, the ESLint exclude
      baselines, and `scripts/parity/pipeline/schema/ruby/Gemfile` with its
      lockfile.
- [ ] The twelve `gem-version.ts` files read `TINY = 5`, `PRE = "2"`, with the
      tests that assert them, so `VERSION.STRING` is `"8.0.5.2"`.
- [ ] If `record-the-mirrored-ref-in-each-package` has merged, its script is
      re-run and the `mirrors` fields read `v8.0.5.2` with the new SHA.
- [ ] The PR is rebased onto a `main` commit whose CI run is green and is
      merged with nothing landing in between, so its parent can be tagged.
- [ ] Every CI job is green. Each gate the dry run listed as "not exercised"
      is recorded in the PR body as green, mechanically fixed, or red, with
      what fixed it. A red on a unit outside the ledger is fixed here if the
      fix is mechanical; otherwise the PR stops and the gap is filed as a
      tooling story in this RFC. A Schema Parity red from the activerecord
      test-schema delta is fixed by landing
      `mirror-the-v8-0-5-2-activerecord-test-schema-models-and-fixtures` in
      this PR's place in the sequence, not by an exclude.
- [ ] The PR body gives the `parity:api` / `parity:test` rows before and
      after.

## Definition of done

Not closed by: a baseline, mark or exclude row that is wider than on `main`;
a re-pin of a drifted pair; a skipped or `continue-on-error` job.

## Notes

The LOC ceiling counts the hand edits. The recite commit, regenerated
manifests, the report and the ledger file are generated; say so in the PR
body. Announce the merge: every open PR that touches `body-pins.json` must
rebase (ledger rule 5 reds it otherwise).
