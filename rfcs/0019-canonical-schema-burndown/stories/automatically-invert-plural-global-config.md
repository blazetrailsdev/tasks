---
title: "Converge automatically_invert_plural_associations to global test default"
status: claimed
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T21:14:11Z"
assignee: "automatically-invert-plural-global-config"
blocked-by: null
---

## Context

Rails sets `ActiveRecord::Base.automatically_invert_plural_associations = true`
globally in `activerecord/test/cases/helper.rb:40`. trails defaults it to
`false` (`base.ts`) and currently localizes it onto specific models
(`test-helpers/models/cpk.ts` CpkCarReview, and Rails' own
`models/subscription.rb`). Converge to the global test default so per-model
localization is unnecessary, matching Rails fidelity.

- trails: `packages/activerecord/src/base.ts`,
  `packages/activerecord/src/test-helpers/` global setup
- Rails: `activerecord/test/cases/helper.rb:40`

## Acceptance criteria

- [ ] Set `automaticallyInvertPluralAssociations = true` in the AR test global
      setup (mirror helper.rb), audit suite impact, and drop the localized
      per-model flag on CpkCarReview. Fidelity over local hacks.
