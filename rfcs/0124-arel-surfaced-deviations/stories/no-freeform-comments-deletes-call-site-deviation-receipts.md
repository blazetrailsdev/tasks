---
title: "no-freeform-comments drops the story id off CONVERGEABLE receipts"
status: ready
updated: 2026-08-28
rfc: "0124-arel-surfaced-deviations"
cluster: null
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

A deviation receipt (`@noRailsEquivalent`, `@missingRailsCall`,
`@missingRailsArgs`) has exactly two shapes, and neither carries prose:

- `PERMANENT` — the token is the whole receipt.
- `CONVERGEABLE <story-id>` — the story is the receipt; the tag only points
  at it.

`no-freeform-comments`' autofix strips everything after the tag's permanence
token. For `PERMANENT` that is the right result — PR #7132 (`9415a63a9`)
reduced arel's 12 `PERMANENT` receipts to the bare token and nothing was
lost. For `CONVERGEABLE` it also removed the story id, which was the only
link between the deviation and the work that converges it:

```
-   * @missingRailsCall build_statement_pool — CONVERGEABLE (story abstract-adapter-constructor-drops-rails-config-arg): RFC 0106: the base ctor takes no
+   * @missingRailsCall build_statement_pool — CONVERGEABLE
```

`classifyReason` reads only the leading token, so a bare `CONVERGEABLE` is
green on every gate; the two-shape gate is
`receipt-gates-require-permanent-bare-or-convergeable-story` (RFC 0025). This
story is the rule-side fix and the restoration.

## Converged shape

`CONVERGEABLE` is followed by one story id and nothing else — no
parentheses, no `story` word, no prose:

```
/** @noRailsEquivalent CONVERGEABLE abstract-adapter-constructor-drops-rails-config-arg */
/** @missingRailsCall build_statement_pool — CONVERGEABLE abstract-adapter-constructor-drops-rails-config-arg */
```

`PERMANENT` stays bare. No citation form, no `@railsCite`, no in-body prose
receipt: a deviation that needs explaining is `CONVERGEABLE` and the
explanation lives in its story.

## Acceptance criteria

- [ ] `no-freeform-comments` keeps the first token after `CONVERGEABLE`
      when it is a story id (matches an entry in the tasks DB / the
      stale-story-refs manifest) and strips everything after it; it strips
      everything after `PERMANENT`. Tests pin both, plus the legacy
      `(story <id>)` form being rewritten to the bare id.
- [ ] Every `CONVERGEABLE` tag in `9415a63a9`'s diff that lost its story id
      has it restored in the bare form above (take the id from
      `9415a63a9~1`); a tag whose pre-sweep reason named no story is either
      given one or flipped to `PERMANENT` — never left bare `CONVERGEABLE`.
- [ ] CLAUDE.md's receipt sentences describe the two shapes and say
      nothing about a reason being reviewed.
- [ ] `pnpm parity:api:extra`, `parity:api:calls`, `parity:api:calls:args`
      green; no baseline row added.
