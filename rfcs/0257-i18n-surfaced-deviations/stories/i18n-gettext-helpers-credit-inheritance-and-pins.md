---
title: "i18n: credit Gettext::Helpers to its module, fix the failing inheritance edge, pin bodies"
status: in-progress
updated: 2026-11-23
rfc: "0257-i18n-surfaced-deviations"
cluster: null
packages:
  - "i18n"
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10612
claim: "2026-11-23T00:14:06Z"
assignee: "i18n-api-tests-port-interpolation-link-and-unexclude-backend-suites"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package i18n` (2026-11-22) scores `gettext/helpers.rb`
0/13 (6 DeclOnly), even though every method in
`vendor/i18n/v1.14.8/lib/i18n/gettext/helpers.rb:17-61` is ported in
`packages/i18n/lib/gettext/helpers.ts`. The bodies sit in a module-private
`const _Helpers = { … }` (line 6) that is spread into
`export const Helpers = { ..._Helpers, _: …, s_: … }` (line 69), so the
extractor does not credit them to the `I18n::Gettext::Helpers` module.
`backend/gettext.rb` is also 4/5 and `gettext.rb` 1/2. One inheritance edge
fails (12/13), and 51 of 283 bodies are unpinned.

## Acceptance criteria

- `Helpers` is a single plain-object module at its Rails name, with the
  methods and Ruby's `alias`es (`_`, `s_`, `p_`, `n_`, `ns_`, `np_`) defined
  as `helpers.rb` does them. There is no `_Helpers` intermediate.
- `gettext/helpers.rb` reaches 13/13. The missing members of `backend/gettext.rb`
  and `gettext.rb` are ported or receipted.
- Fix the failing inheritance edge (see `pnpm parity:api --package i18n --inheritance`).
- Pin the unpinned i18n bodies (`pnpm parity:api:pins`).
- i18n parity:api delta is non-negative.
