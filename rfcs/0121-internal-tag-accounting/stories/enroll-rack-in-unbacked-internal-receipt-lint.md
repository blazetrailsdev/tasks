---
title: "Burn down rack's 18 unbacked @internal tags and enrol it in the receipt lint"
status: ready
updated: 2026-08-27
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0121's `unbacked-internal-needs-receipt` enrollment set is ONLY-GROW, and
it now holds `trailties`, `activemodel`, `activesupport`, `globalid` and `i18n`
(the last two enrolled by PR #7105). `rack` is in the
`blazetrails/rails-private-jsdoc` population (`eslint.config.mjs`) but has no
enrollment story, so its `@internal` tags are unmeasured in the reverse
direction.

Probing the rule against `packages/rack/src` reports **18 sites** across five
files:

```text
rack/src/mock-request.ts        (parseUriRfc2396, …)
rack/src/multipart/parser.ts
rack/src/multipart/uploaded-file.ts   (read, getData, isFile, close, each, …)
rack/src/recursive.ts
rack/src/utils.ts
```

Each is a public declaration carrying `@internal` whose (file, name) is absent
from `eslint/rails-private-methods.json`, so the tag drops it from the measured
surface with no receipt — exactly the debt RFC 0121 exists to burn down.

`did-you-mean` was probed at the same time and reports **0** sites, so it can be
enrolled by config alone; fold it into this story or file it as a trivial
follow-up.

## Converged shape

Per the RFC's per-package pattern:

1. Re-run the sweep against the current manifest — a member is a candidate when
   `files[rel]` lists its name but `entities[rel]` does not list its enclosing
   class/interface.
2. Decide each of the 18 sites: delete the member, keep `@internal` because it
   is genuinely Rails-private (and fix the manifest gap), or write a
   `@noRailsEquivalent PERMANENT|CONVERGEABLE` receipt.
3. Only then add `packages/rack/src/**/*.ts` (and `did-you-mean`) to the `files`
   list in BOTH `eslint.config.mjs` and `eslint/rails-private-jsdoc.config.mjs`
   — the two lists must stay in sync, and the set is never shrunk to green a run.

Note that pulling an `@internal` re-enters the name into `parity:api:extra`.
`rack` is not in `GATED_PACKAGES`, so `pnpm parity:api:extra:gate` will not red,
but the measured total will move — check it before and after.

## Acceptance criteria

- [ ] No `@internal` remains in `packages/rack/src` whose only backing was
      file-wide manifest keying.
- [ ] `rack` (and `did-you-mean`) appear in the `unbacked-internal-needs-receipt`
      `files` list in both config files.
- [ ] No `@noRailsEquivalent` reason claims neither PERMANENT nor CONVERGEABLE.
- [ ] `Rails API/Test Comparison` and `Lint` green.
