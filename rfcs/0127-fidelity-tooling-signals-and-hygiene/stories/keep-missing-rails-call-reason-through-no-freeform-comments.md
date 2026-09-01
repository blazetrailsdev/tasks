---
title: "no-freeform-comments strips the reason from every missingRailsCall receipt in a swept package"
status: draft
updated: 2026-09-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`blazetrails/no-freeform-comments` deletes the reason prose from every
`@missingRailsCall` / `@missingRailsArgs` receipt in a swept package, so a
permanent deviation's justification has nowhere to live in the file it is about.

`renderTag` (`eslint/no-freeform-comments.mjs:266-298`) rebuilds each kept tag
from its data alone:

```js
return [
  `@${name}`,
  rubyCall,
  rubyCall && permanence && "—",
  permanence?.[1],
  story,
  movedByShortName,
]
  .filter(Boolean)
  .join(" ");
```

so `@missingRailsCall fetch — PERMANENT: <why>` is rewritten to
`@missingRailsCall fetch — PERMANENT` on the next `eslint --fix`.

That contradicts two other rules the repo states:

- the rule's OWN header (`no-freeform-comments.mjs:11-15`) keeps these tags
  "together with the reason argument each requires … `parity:api:extra` and
  `lint-missing-rails-call-reasons` read those reasons and they are reviewed,
  so they are arguments, not prose";
- CLAUDE.md's "Every deviation you do ship is justified **at the call site**,
  not in the PR body."

Today the reason CAN only go in the PR body, which rots and is not greppable.

Observed on PR #7330: reasons were written onto the three
`@missingRailsCall fetch — PERMANENT` receipts in
`packages/activerecord/src/associations/{belongs-to,has-one,has-many}-association.ts`
(each stating that the only `fetch` in the Rails body is
`options.fetch(:ensuring_owner_was, nil)` in the `:destroy_async` arm —
`belongs_to_association.rb:34`, `has_one_association.rb:50`,
`has_many_association.rb:52`), the pre-commit `eslint --fix` stripped them, and
the review round that followed correctly reported the PR body as claiming work
the diff did not contain. Reproduced in isolation: re-adding the reason and
running `npx eslint --fix` on `belongs-to-association.ts` alone reduces it
straight back to the bare tag.

The asymmetry hides it: `packages/activesupport/**` is on the rule's ignore
list (`eslint.config.mjs:880`), so an identical receipt written there survives.
Same tag, same repo, two outcomes.

## Converged shape

`renderTag` keeps the reason for the tags whose reason is machine input —
`@missingRailsCall` and `@missingRailsArgs` — after the permanence token,
instead of truncating at it. `@noRailsEquivalent` already has the same claim on
its reason (`parity:api:extra` scores it) and should be decided in the same
change rather than separately.

The narrow alternative, if keeping free prose is judged too wide a hole in the
no-English-comments policy, is a structured tail the renderer preserves — e.g.
a required `rails:<gem>/<path>.rb:<line>` token plus a fixed vocabulary — so the
receipt still names WHICH Rails call is unmade and WHY, without readmitting
sentences. Either way the outcome must be that a reviewer can read the
justification in the file, not only in a merged PR body.

## Acceptance criteria

- A `@missingRailsCall` / `@missingRailsArgs` reason written at a call site in a
  swept package survives `eslint --fix`.
- The three association receipts above carry their reason in-file.
- `eslint/no-freeform-comments.test.mjs` covers the kept-reason form, and the
  round-trip (fix twice, second run is a no-op).
- `pnpm parity:api:reasons` and `pnpm lint` stay green; no receipt loses its
  permanence token.
