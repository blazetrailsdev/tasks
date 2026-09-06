---
title: "Decide the view-directory naming convention: snake_case dirs or explicit templates forever"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Every page controller in trailmap has to name its template explicitly:

```ts
    this.render({ template: "rfc-pages/show", locals, status });
```

because the implicit lookup and the repo's file-naming convention disagree.
trails derives the view prefix with Rails' `underscore`, so
`RfcPagesController` looks for `app/views/rfc_pages/show`. Verified directly
rather than assumed — a probe subclass named `RfcPagesProbeController` fails
with:

```text
Missing template rfc_pages_probe/show
```

That is FAITHFUL to Rails, where `RfcPagesController` renders
`app/views/rfc_pages/`. It is not a framework bug and must not be filed as
one. The collision is with trailmap's own convention: every other file here
is kebab-case (`read-models-controller.ts`, `rfc-pages-controller.ts`), and
`app/views/rfc-pages/` was named to match.

Surfaced in blazetrailsdev/trailmap#11, which shipped `/rfc/<id>` and
`/story/<id>` and paid this cost twice.

## Why it needs deciding rather than leaving

`template:` on every render is a papered-over disagreement, and it is silent:
a controller that forgets it does not fall back, it 500s with a missing
template at request time. Each new page page pays it again, and the reason
lives only in a comment on two controllers.

## The options

1. **Rename the view directories to snake_case** (`app/views/rfc_pages/`),
   matching Rails and letting implicit render work. Costs one exception to
   the kebab-case rule, in the one place Rails' own lookup dictates the name.
2. **Keep kebab-case and keep naming templates explicitly**, and write the
   rule down in CLAUDE.md so it is a convention rather than a surprise.

Either is defensible; what is not defensible is the current state, where the
choice is implicit in two files.

## Acceptance criteria

- One of the two options is applied across every page controller.
- The rule is recorded in CLAUDE.md next to the camelCase convention.
- A controller that follows the rule renders without naming a template, OR
  the requirement to name one is stated where a new page's author will read it.
