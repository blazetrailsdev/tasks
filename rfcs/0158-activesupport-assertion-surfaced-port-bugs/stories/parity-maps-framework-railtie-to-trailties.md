---
title: "parity-maps-framework-railtie-to-trailties"
status: draft
updated: 2026-11-20
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A framework's `railtie.rb` is ported in trailties, not in its own package: `I18n::Railtie`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/i18n_railtie.rb`) is `Trailtie` in
`packages/trailties/lib/trailties/i18n.ts`, and `ActiveSupport::Railtie` (`active_support/railtie.rb`)
is `packages/trailties/lib/trailties/active-support.ts`, with `active-record.ts`, `action-view.ts` and others
beside them. The parity tooling cannot see these. `PATH_SEGMENT_ALIASES` (`scripts/parity/conventions.ts:213`)
maps the segment `railtie` to `trailtie`, but only inside the Ruby file's own package, and
`RUBY_FILE_TS_OVERRIDES` (`:234`) maps one package to itself. So every framework railtie is a row in
`scripts/parity/unported-files/<pkg>.ts` instead (`i18n_railtie.rb`, `/railtie.rb` in activesupport.ts), even
where it is already ported.

## Acceptance criteria

- `parity:api` maps `<pkg>:railtie.rb` and `<pkg>:*_railtie.rb` to `trailties:trailties/<framework>.ts`
  (`I18n::Railtie` → `trailties/i18n.ts`), the convention trails already uses. Generate the doc from
  `conventions.ts`.
- Delete the unported-files rows for railtie files that are ported, starting with activesupport's
  `i18n_railtie.rb` and `/railtie.rb`.
