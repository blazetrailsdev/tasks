---
title: "Journey::Path::Pattern builds regexp sources with local helpers instead of Regexp.union"
status: draft
updated: 2026-10-12
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/journey/path/pattern.ts` builds its
regexp sources through three file-local helpers Rails does not have:
`regexUnion`, `combinedFlagsFor` and `combinedFlagsUsed`. Rails calls
`Regexp.union` and interpolates the result, which is `Regexp#to_s`
(`(?-mix:…)`, each member carrying its own flags):

- `AnchoredRegexp#visit_SYMBOL` — `"(#{Regexp.union(re)})"`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/path/pattern.rb:84-91`)
- `UnanchoredRegexp` / `visit_STAR` — the same union on `@matchers[node]`
- `requirements_for_missing_keys_check` — `/\A#{regex}\Z/`
- `offsets` — `/#{Regexp.union(@requirements[node])}|/` (`pattern.rb:196`)

The helpers re-derive that by hand: `regexUnion` joins `r.source` with `|`
and scopes only the `i` / `s` flags, and the two `combinedFlags*` functions
hoist the remaining flags onto the outer regexp. trails#8837 had to teach
`regexUnion` that a requirement may be a String (`constraints: { format: :json }`,
`actionpack/test/controller/routing_test.rb:247-257`), since `Regexp.union`
quotes a String or Symbol; that arm now lives in the helper, not in a
`Regexp.union` port.

ruby-compat already exports `rbRegSUnion` (`packages/ruby-compat/src/regexp.ts`).

## Acceptance criteria

- Each of the four sites calls the ruby-compat `Regexp.union` port and
  interpolates its `Regexp#to_s` form, as the Rails line does.
- `regexUnion`, `combinedFlagsFor` and `combinedFlagsUsed` are deleted; if JS
  cannot scope a flag Ruby can, that one arm is receipted at the call site.
- `format symbol constraints` (`controller/routing.test.ts`) and the journey
  pattern tests stay green.
