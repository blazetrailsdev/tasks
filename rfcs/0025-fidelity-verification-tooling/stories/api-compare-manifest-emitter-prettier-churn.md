---
title: "api:compare dirties eslint/rails-callback-invocations.json on every run (emitter output vs prettier formatting)"
status: draft
updated: 2026-07-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every `pnpm api:compare` run dirties the tracked file
`eslint/rails-callback-invocations.json`, on a clean checkout of `main`, with
no source changes. Reproduced during PR #4878:

```bash
git checkout origin/main && API_COMPARE_FORCE=1 pnpm api:compare
git status --porcelain
 M eslint/rails-callback-invocations.json   # 34 insertions(+), 11 deletions(-)
```

Root cause: the emitter writes raw `JSON.stringify` output at
`scripts/build-rails-privates-manifest.ts:461`:

```ts
fs.writeFileSync(CALLBACK_OUT, JSON.stringify(manifest, null, 2) + "\n");
```

`JSON.stringify(…, null, 2)` expands every array onto multiple lines:

```json
"_createRecord": [
  "create"
],
```

but the committed file is prettier-formatted, and prettier collapses short
arrays onto one line:

```json
"_createRecord": ["create"],
```

So the emitter's output and the committed formatting can never agree — the
manifest is dirty the instant the generator runs, forever. The content is
identical; the diff is 100% formatting.

This is a live trap, not cosmetics. `api:compare` is the tool agents are told
to run to verify the api:compare gate, so every agent that runs it gets a
dirtied tracked file. Two failure modes, both observed on #4878:

1. The churn gets swept into a feature PR by `git add -A` and ships as
   unrelated noise (caught twice by hand on #4878 and reverted).
2. Turns are burned diagnosing whether the churn is yours or pre-existing.

Sibling emitters in the same file (lines 67, 226, 357) use the identical
`JSON.stringify(…, null, 2)` pattern; they appear unaffected only because
their payload shapes don't hit prettier's array-collapse rule. Worth checking
all four write sites rather than only the callback one, so the same trap
can't reappear when a payload shape changes.

## Acceptance criteria

- [ ] `pnpm api:compare` on a clean `main` leaves `git status` clean — no
      tracked file is modified by running the generator.
- [ ] `eslint/rails-callback-invocations.json` round-trips: emitting it, then
      running `prettier --check` on it, passes without a rewrite.
- [ ] Fix at the emitter (format the output the way prettier would before
      writing — e.g. run the payload through prettier's API/`--write`, or a
      shared `writeJsonManifest()` helper), NOT by reformatting the committed
      file to match `JSON.stringify` (that would break `prettier --check` /
      lint-staged, which rewrites it back on commit).
- [ ] All four write sites in `scripts/build-rails-privates-manifest.ts`
      (lines 67, 226, 357, 461) go through the same helper so the trap can't
      recur when a payload shape changes.
- [ ] No behavior change to the callback-invocation lint rule — content of the
      manifest is byte-identical modulo formatting.
