---
title: "Enforce no-freeform-comments repo-wide by exclusion list, and remove the parity:api:cites gate"
status: draft
updated: 2026-08-28
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: ["activerecord", "activemodel", "activesupport", "arel"]
deps: []
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two changes, one PR, because they are the same decision: the 2026-08-27
maintainer policy is that trails carries **no English-language comments**, and
today's tooling both under-enforces it and separately gates the very thing it
strips.

### 1. `no-freeform-comments` is enrolled by allowlist, so new prose lands freely

`eslint/no-freeform-comments.mjs` is not malfunctioning. Linting the enrolled
files that recent commits touched — `activerecord/src/connection-adapters/abstract-adapter.ts`,
`connection-adapters/postgresql/schema-statements-class.ts`,
`associations/collection-proxy.ts` — reports **zero** violations. The rule
catches what it is pointed at.

The leak is the enrollment glob list in `eslint.config.mjs:818-863` (arel,
activemodel, AR `relation/`, `support/`, `a*.ts`, the adapter trees,
associations impl, each with `ignores: **/*.test.ts` on two of the blocks).
Everything the last 25 commits actually commented into is **outside** it.
Added comment lines by file over `git log -25`:

| file | added comment lines | enrolled? |
| --- | --- | --- |
| `scripts/api-compare/compare.ts` | 182 | no |
| `scripts/api-compare/param-names.ts` | 81 | no |
| `packages/activerecord/src/attribute-methods/serialization.ts` | 75 | no |
| `scripts/api-compare/cites.ts` | 64 | no |
| `packages/activerecord/src/base.ts` | 59 | no |
| `packages/activesupport/src/file-update-checker.ts` | 54 | no |
| `scripts/parity/shared-cache.ts` | 45 | no |
| `packages/activerecord/src/migration.ts` | 22 | no |
| `packages/website/src/lib/frontiers/sql-js-adapter.ts` | 18 | no |
| `packages/activerecord/src/attribute-methods/read.ts` | 11 | no |
| `*.test.ts` under enrolled trees | many | explicitly `ignores`d |

Sample of what landed in `attribute-methods/serialization.ts` (#7176):

    /**
     * Declare that an attribute should be serialized before saving and
     * deserialized when loading.
     * ...
     * Usage:
     *   User.serialize('preferences', { coder: 'json' })
     */

`scripts/**` is not covered by any block at all and is the single largest
source. Test files are excluded by construction.

The config block's own prose says the scoping is deliberate — "widen it a
package at a time, after auditing that package's comments, never ahead of the
audit" — which is exactly why new code in an unswept file has a permanent free
pass. **The allowlist shape is the bug.** The fix is to invert the default:
turn the rule on repo-wide as `error`, and replace the enrollment allowlist
with a shrinking **exclusion** list of the unswept trees, on the same
only-shrink discipline as every other ratchet in this repo. A new comment in
an unswept file then becomes impossible: the file is either excluded wholesale
(and the sweep story burns the row down) or it is clean.

Core ESLint has no rule that substitutes. `no-inline-comments` only bans a
comment sharing a line with code — it would catch none of the examples above —
and nothing in core can express the allowlist that matters (keep `@internal` /
`@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs` and their
permanence token, keep tool directives, delete the rest, autofixably).
`no-freeform-comments` stays the vehicle.

The existing sweep story `enroll-remaining-packages-in-no-freeform-comments`
(700 loc, RFC 0023, draft) is the *content* burndown and stays separate; this
story is the *mechanism* flip and should shrink that story's remit to
"delete exclusion rows".

### 2. `parity:api:cites` (RFC 0121, #7165) contradicts the policy and is removed

`no-freeform-comments.mjs`'s header states the policy directly:

> Rails citations are NOT kept either. A `Mirrors:` line, a `.rb:LINE`
> reference and a Ruby constant path were all kept until 2026-08-27 ... The
> pointer rots the same way — a line number is wrong the moment Rails edits the
> file above it.

`parity:api:cites` exists to validate exactly those `gem/path.rb:LINE`
pointers inside receipt reasons. The two cannot both be right, and the
maintainer's call is that the citations go, so the gate that polices them goes
with them. Removal surface:

- `scripts/api-compare/cites.ts` (292 loc)
- `scripts/api-compare/cites.test.ts` (190 loc)
- `scripts/api-compare/lint-cites.ts` (110 loc)
- `scripts/api-compare/cite-mark.json`
- `package.json` — the `parity:api:cites` and `parity:api:cites:tighten` scripts
- `.github/workflows/ci.yml:1524-1532` — the "Rails citation ratchet" step
- `CLAUDE.md` — step 5 of the "Before you open the PR" checklist, and the
  renumbering of steps 6-8 that follow it

Check for stragglers before finishing: `grep -rn "cites\|cite-mark\|citeMark"`
over `scripts/ .github/ package.json CLAUDE.md CONTRIBUTING.md docs/ eslint/`.
`scripts/closing-story-references.ts:63` and
`scripts/api-compare/missing-rails-call-tags.ts:318` match on the English word
"cites" only and must NOT be touched.

Note the interaction: with `:cites` gone, a `use-site:` prefix and the
qualified-basename discipline it enforced become dead conventions — but do not
go rewrite existing receipt reasons in this PR. The reasons themselves are
prose that the repo-wide flip will strip on its own schedule.

## Acceptance criteria

- `blazetrails/no-freeform-comments` is configured `error` over the whole repo
  (all `packages/*/src/**` including `*.test.ts`, `scripts/**`, and the
  top-level `.mjs`/`.ts` config and tooling files), with the previously-enrolled
  trees carried over unchanged.
- The former enrollment allowlist is replaced by an exclusion list of unswept
  trees, each row carrying the story that burns it down, and the block's
  comment states the only-shrink contract: a row is deleted, never added, and
  never widened to cover new work.
- The exclusion list is derived from an actual measured run, not guessed — run
  the rule repo-wide in `report` mode
  (`--rule '{"blazetrails/no-freeform-comments":["warn",{"report":true}]}'`)
  and exclude at the narrowest tree granularity the violations justify.
- No file that lints clean today is excluded.
- `scripts/api-compare/cites.ts`, `cites.test.ts`, `lint-cites.ts` and
  `cite-mark.json` are deleted; the two `package.json` scripts and the CI step
  are gone; `CLAUDE.md`'s checklist no longer has a citation step and its
  remaining steps are renumbered consecutively.
- `grep -rn "parity:api:cites\|lint-cites\|cite-mark" .` returns nothing
  outside `tasks/`.
- `pnpm lint` is green on `main` as configured, and `pnpm vitest run eslint/`
  and `pnpm vitest run scripts/api-compare/` pass.
- No baseline, allowlist, or mark is widened anywhere to absorb the flip.
