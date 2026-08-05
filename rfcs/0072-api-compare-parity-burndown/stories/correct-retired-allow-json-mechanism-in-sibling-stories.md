---
title: "Sweep the retired extra-surface-allow.json / @internal instruction out of 19 RFC 0072 story bodies"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6134
claim: "2026-08-05T16:13:06Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `extra-surface-base-accessors-classify` (PR #5919).

That story's acceptance criteria instructed applying (b) verdicts as "`@internal`
tag, or an entry in `scripts/api-compare/extra-surface-allow.json`". Both halves
are stale:

- `scripts/api-compare/extra-surface-allow.json` **does not exist**. RFC 0080
  retired it; `scripts/api-compare/extra-surface.ts:44-47` states the
  `@noRailsEquivalent <reason>` JSDoc tag is now "the ONLY such source".
- `@internal` does **not** suppress an extra. Confirmed empirically on #5919:
  `Base.ensureSchemaLoaded` was already tagged `@internal` and still reported as
  novel; it only dropped out once `@noRailsEquivalent` was added.
  `extract-ts-api.ts:637` records `internal: true` on the manifest, but
  `extra-surface.ts` never filters on it.

19 story bodies under this RFC still carry the retired instruction:

````text
grep -rln "extra-surface-allow.json" tasks/rfcs/0072-api-compare-parity-burndown/stories | wc -l
# => 19
```text

Each one will send its agent looking for a file that isn't there, and — worse —
`@internal` looks like it works (it is accepted, tagged, and committed) while
leaving the novel count unchanged, so an agent can believe a name is classified
when it is not.

Precedent: `correct-mixin-leak-mechanism-in-sibling-stories` (closed) fixed the
same class of stale-mechanism drift across sibling story bodies.

Note the reason string is not free text: `classifyReason`
(`extra-surface.ts:323`) reads a leading `PERMANENT` or `CONVERGEABLE` token,
and anything else counts as `unclassified`. Per Dean's direction on #5342,
convergeable surface should be left counted rather than tagged at all, so the
corrected instruction should say `PERMANENT` only.

## Acceptance criteria

- Replace the `@internal` / `extra-surface-allow.json` instruction in all 19
  RFC 0072 story bodies with the `@noRailsEquivalent PERMANENT <reason>` tag,
  citing `scripts/api-compare/extra-surface.ts:44-47`.
- State the #5342 rule alongside it: only irreducible cases get a tag;
  convergeable surface stays counted and gets a story.
- Do not change any story's status, scope, or acceptance criteria beyond the
  mechanism correction.
- Docs-only change (`.md`), so exempt from the 500 LOC ceiling — but keep it to
  the mechanism sweep, no drive-by rewording.
````
