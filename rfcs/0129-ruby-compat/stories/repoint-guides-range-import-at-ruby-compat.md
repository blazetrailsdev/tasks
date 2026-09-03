---
title: "Repoint the guides' Range import at ruby-compat (Guides Code Type Check red on main)"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Guides Code Type Check` is red on main at commit `9028957` (PR #7441). The
failure is one line:

```text
packages/website/docs/guides/idioms.md:252:10: error TS2305:
  Module '"@blazetrails/activesupport"' has no exported member 'Range'.
```

PR #7441's shim sweep (`third-round-ruby-compat-reexport-shim-sweep`, RFC 0129)
deleted `export { Range } from "@blazetrails/ruby-compat/range"` from
`packages/activesupport/src/index.ts` and repointed every importer in
`packages/` at `@blazetrails/ruby-compat`. The sweep did not repoint the
guide prose, which is typechecked as real code.

The guide's surrounding prose also names the wrong package:

> Ruby `Range` (`1..10`, `1...10`) has no JS equivalent. Use the `Range`
> class from `@blazetrails/activesupport`.

The job's `if:` is `guides_affected == 'true'` and, on a PR, additionally
requires the `run-guides` label
(`.github/workflows/ci.yml:596-602`), so it does not run on an unlabelled PR
and only fired once #7441 reached main. Any future sweep that removes a
re-export has the same blind spot.

## Converged shape

`packages/website/docs/guides/idioms.md:249-252` — prose and import both move
to the package that now owns the symbol:

```ts
import { Range } from "@blazetrails/ruby-compat";
```

## Acceptance criteria

- `pnpm guides:typecheck` is green.
- The `Range` prose in `idioms.md` names `@blazetrails/ruby-compat`.
- `grep -rn "@blazetrails/activesupport" packages/website/docs/guides/` turns
  up no other symbol that RFC 0129 has already moved to `ruby-compat`
  (`KeyError` and `regexpEscape` moved in the same PR).

## Notes

Filed from the post-merge sweep of PR #7441; a central main-CI fixer was
already assigned when this was diagnosed, so the one-line fix was deliberately
not pushed from the story's worktree to avoid colliding with theirs. If it is
already green when picked up, close this as done rather than reapplying — but
keep the third acceptance criterion, which is a wider check than the failing
line.
