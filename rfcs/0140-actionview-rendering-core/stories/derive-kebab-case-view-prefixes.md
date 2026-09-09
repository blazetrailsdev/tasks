---
title: "Derive kebab-case view prefixes, so apps need no snake_case exception in app/views"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview", "actionpack", "trailties"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails derives a controller's view prefix with Rails' `underscore`
(`AbstractController::Base.controllerPath`,
`packages/actionpack/src/abstract-controller/base.ts:160-170`), so
`RfcPagesController` looks for its templates under `app/views/rfc_pages/`.
That is faithful to Rails — `abstract_controller/base.rb:127` — and
`trails new`'s own generators emit snake_case view directories to match
(`packages/trailties/src/generators/rails/controller/controller-generator.ts`
builds `app/views/${paths.viewBase}/`, and the authentication generator ships
`app/views/passwords_mailer/`).

trailmap is kebab-case in every other filename, and named its view directories
`app/views/rfc-pages/` to match. The two disagreed, and the disagreement is
silent: a controller that does not pass `template:` explicitly does not fall
back, it 500s with a missing template at request time. trailmap#11 paid that
twice, and blazetrailsdev/trailmap#21 resolved it by renaming its view
directories to snake_case — conforming the application to the framework,
because the framework is what it is today.

## What to do

Make the framework derive **kebab-case** view prefixes, so an app whose files
are kebab-case throughout does not have to carve out one snake_case exception
in `app/views/` to get implicit rendering.

Concretely, at minimum:

- the prefix derivation behind `controllerPath` / the view-prefix lookup
- the generators, so `trails new` and `trails g controller` emit view
  directories in whatever spelling is chosen
- the lookup's missing-template message, which names the path it looked for

## The parity question this has to answer first

**This is a deliberate divergence from Rails, and it is the whole cost of the
story.** Rails' prefix is `underscore(controller_path)`, and this repository
measures itself against Rails' API surface with `pnpm parity:api`. A change
here is not a bug fix; it is a decision that trails' file-naming convention is
kebab-case and that it will not match Rails on this one derivation.

Options worth pricing before any code is written:

1. **Derive kebab-case unconditionally.** Simplest, and breaks every existing
   app with snake_case view directories — including `trails new`'s previous
   output and the framework's own fixtures.
2. **Accept both spellings in the lookup**, preferring one. No app breaks and
   no one has to choose; the cost is two paths probed on every miss and a
   convention that is not actually decided.
3. **Make it configurable**, defaulting to Rails' spelling. Parity is kept by
   default and an app opts in, at the cost of one more knob.

Whichever is chosen, say so in the RFC and in the generated app's `CLAUDE.md`,
because the current situation — the choice implicit in one derivation and paid
for by every application — is what this story exists to end.

## Follow-on

blazetrailsdev/trailmap#21 renamed trailmap's view directories to snake_case
and recorded the rule in its `CLAUDE.md`
(`test/views/view-directory-names.test.ts` holds it). If this story lands with
option 1 or 3, trailmap renames back and deletes that exception; the test is
what will fail loudly and point at this story when it does.

## Acceptance criteria

- The parity question above is answered explicitly in the RFC, not implicitly
  in a diff.
- The chosen spelling is derived in ONE place, and the generators, the lookup
  and the missing-template message all agree with it.
- A controller whose view directory follows the chosen convention renders with
  no `template:` argument, proven by a test.
- `pnpm parity:api` delta for actionpack/actionview is recorded in the PR body,
  with the divergence named if the delta moves.
