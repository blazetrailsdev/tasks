---
title: "no-freeform-comments autofix deletes a multi-line PERMANENT-SKIP's citation"
status: draft
updated: 2026-10-21
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: lint
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/no-freeform-comments` judges each `//` line on its own and its
autofix deletes any line that does not match the allowlist regex
(`eslint/no-freeform-comments.mjs:84`). The allowlist includes
`\bPERMANENT-SKIP:` and `\bBLOCKED:`, so the _first_ line of a receipt is kept
and every continuation line is deleted.

Observed on trails#9180. This receipt was written:

```ts
// PERMANENT-SKIP: the assertion is that a lookup reaches `I18n.cache_store`
// (`vendor/i18n/v1.14.8/lib/i18n/backend/cache.rb:93-110`); CLAUDE.md
// § "A translation lookup is synchronous; the load is an awaited step"
it.skip("translate caching backend", () => {});
```

`eslint --fix` ran through the pre-commit lint-staged hook and committed this:

```ts
// PERMANENT-SKIP: the assertion is that a lookup reaches `I18n.cache_store`
it.skip("translate caching backend", () => {});
```

The citation is the part that was deleted. Root CLAUDE.md § Verification is
explicit that "a skip with no such citation counts as a gap", so the autofix
silently converted a compliant receipt into a gap, in a commit whose diff shows
only the line that survived. Nothing reds: the rule is satisfied, and no gate
checks that a `PERMANENT-SKIP:` names a section.

The surviving receipts in the repo are all single long lines
(`grep -rn "PERMANENT-SKIP" packages/*/src --include=*.ts`), which is the
workaround arrived at by whoever hit this before, not a documented convention.

## Converged shape

Two independent fixes, both small:

1. **The rule keeps a contiguous block whose first line is allowlisted.** A run
   of `Line` comments with no blank line between them, whose first line matches
   `ALLOWLIST`, is kept whole — the continuation lines belong to the receipt
   that line opens. `eslint/no-freeform-comments.test.mjs` grows a case for a
   three-line `PERMANENT-SKIP:` block and one for a `BLOCKED:` block.
2. **A `PERMANENT-SKIP:` must name a section.** A receipt with no
   `CLAUDE.md` reference and no `vendor/<source>/...:<line>` citation reds,
   which is what would have caught the truncation above even without fix (1).

## Acceptance criteria

- [ ] A multi-line `PERMANENT-SKIP:` / `BLOCKED:` block survives
      `eslint --fix` unchanged, with a rule test for each.
- [ ] A `PERMANENT-SKIP:` carrying no CLAUDE.md section and no vendor citation
      is reported, with a rule test.
- [ ] `pnpm lint` stays green across the repo — existing single-line receipts
      all already carry a citation, so the new arm starts at zero.
