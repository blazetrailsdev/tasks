---
title: 'Route#verb reports "ALL" where Rails'' All matcher reports ""'
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
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

Rails' `Journey::Route#verb` is `verbs.join("|")` over each matcher's own
`verb` (`vendor/rails/actionpack/lib/action_dispatch/journey/route.rb:174-181`),
and `VerbMatchers::All.verb` is the empty string
(`journey/route.rb:36-39`). So a route defined with no `via:` reports `""`,
which is what `bin/rails routes` prints in its Verb column.

trails' `ActionDispatch::Routing::Route`
(`packages/actionpack/src/action-dispatch/routing/route.ts`) instead carries an
`"ALL"` sentinel: its constructor maps the string `"ALL"` to
`VerbMatchers.All`, and its private `verbs()` maps that matcher back to
`"ALL"` rather than reading `m.verb`:

```ts
private verbs(): string[] {
  return this.requestMethodMatch.map((m) => (m === VerbMatchers.All ? "ALL" : m.verb));
}
```

Two Rails-facing surfaces then translate the sentinel back by hand —
`routing/inspector.ts:57` (`verb === "ALL" ? "GET" : verb`) and
`inspector.ts:102` (`verb === "ALL" ? "" : verb`) — where Rails' `RouteWrapper`
needs no such arm because `All.verb` already IS `""`. The sentinel also flows
in from `Mapper`, which spells a missing `via:` as the literal `"ALL"`
(`routing/mapper.ts:684,740,814`).

Predates PR #7632, which converged `verb`/`verbs`/`matchVerb` to Rails'
decomposition but left the sentinel in place — removing it changes
`bin/rails routes` output through `inspector.ts` and belongs to no RFC 0139
story that shipped there.

## Converged shape

- `verbs()` is `this.requestMethodMatch.map((m) => m.verb)`, with no `All` arm,
  mirroring `journey/route.rb:180-181`.
- The via-less spelling stops being the string `"ALL"`: `Mapper` passes the
  Ruby-Symbol spelling trails already keys `VERB_TO_CLASS` on (`":all"`,
  `journey/route.ts:51`) or an empty via list, so `Route.verbMatcher` resolves
  `All` without a sentinel.
- `inspector.ts:57` and `:102` drop their `=== "ALL"` arms, matching
  `RouteWrapper` (`actionpack/lib/action_dispatch/routing/inspector.rb`).

## Acceptance criteria

- [ ] `Route#verb` returns `""` for a route defined without `via:`, matching
      `journey/route.rb:174-181` + `:36-39`.
- [ ] No `"ALL"` string sentinel remains in `routing/route.ts`,
      `routing/mapper.ts`, or `routing/inspector.ts`.
- [ ] `inspector` output for a via-less route matches Rails' Verb column.
- [ ] `pnpm parity:api` and `pnpm parity:test --package actiondispatch` do not
      regress.
