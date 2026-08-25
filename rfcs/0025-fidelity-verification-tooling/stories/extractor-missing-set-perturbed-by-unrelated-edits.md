---
title: "Call-set extraction for one method changes when unrelated methods in the same file are edited"
status: done
updated: 2026-08-14
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6542
claim: "2026-08-14T20:20:11Z"
assignee: "extractor-missing-set-perturbed-by-unrelated-edits"
blocked-by: null
closed-reason: null
---

## Context

The call-set extractor's verdict for one method changes when _other_ methods
in the same file are edited, even though the method's own body is untouched.
That makes a baseline row go stale without anything converging, and the
only-shrink gate then demands deleting a row that still records a real
divergence.

Reproduced on PR 6470's branch against `origin/main` at `4a4465834`:

|                                 | `missing` for `actionview lookup-context.ts detail_args_for_any` |
| ------------------------------- | ---------------------------------------------------------------- |
| pristine `origin/main` worktree | `["call → call", "details_cache_key → detailsCacheKey"]`         |
| PR 6470 branch                  | `["call → call"]`                                                |

`LookupContext#detailArgsForAny`'s body is **byte-identical** between the two
— `git show origin/main:packages/actionview/src/lookup-context.ts` and the
branch copy differ nowhere inside that method. The branch's edits to that file
are all in other members: `renderPartialSync` (visibility + a `variants`
parameter), `findTemplate` / `findPartial` / `findLayout` / `renderPartial` /
`renderCollection` / `renderTemplate` (a trailing `variants` parameter),
`render` (a `variants` option), and the constructor (seeding `resolvers` from
constructor-supplied view paths).

The divergence the row records is still real: `detailArgsForAny` builds
`new Requested({...})` directly and never calls `DetailsKey.detailsCacheKey`,
where Rails' `detail_args_for_any` ends with
`[details, DetailsKey.details_cache_key(details)]`
(`actionview/lib/action_view/lookup_context.rb:188-205`). So the row should
still flag, and deleting it — the gate's only remedy for a stale row — would
record a convergence that did not happen and hide a live divergence.

### Reproduction

```bash
git worktree add --detach /tmp/main-probe origin/main
cd /tmp/main-probe && pnpm install --frozen-lockfile
(cd packages/trailties && npx tsc)   # main has no trailties build script
pnpm parity:api:calls                # green; row flags details_cache_key
# then in the PR branch worktree
pnpm parity:api:calls                # 1 STALE: that row no longer flags
python3 -c "import json;d=json.load(open('scripts/api-compare/output/call-mismatches.json'));\
print([r for r in d if r.get('rubyName')=='detail_args_for_any'])"
```

## Converged shape

Extraction for a Ruby↔TS method pair depends only on that pair's bodies (plus
the resolved imports they actually reference), so an edit elsewhere in the
file cannot change another method's `missing` set. Whatever widens the scope —
file- or class-level symbol collection, a positional/line-range method map, or
a cap on reported entries — is narrowed to the method.

## Acceptance criteria

- Editing an unrelated method in a file does not change another method's
  `missing` set; a test asserts that for a representative pair.
- `actionview lookup-context.ts detail_args_for_any` flags
  `details_cache_key → detailsCacheKey` on both main and PR 6470's branch,
  because the divergence is present in both.
- The row is retired only by porting the `DetailsKey.details_cache_key` call,
  not by the gate going quiet.
