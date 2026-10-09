---
title: "activerecord: Translation carries i18n_scope, and lookup_ancestors compares against ActiveRecord::Base"
status: done
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8705
claim: "2026-10-09T12:39:38Z"
assignee: "translation-const-carries-i18n-scope-and-lookup-ancestors-follows-rails"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-n-z` audit (trails#8395), which renamed
`packages/activerecord/src/translation.ts`'s carrier const to `Translation` so `base.ts` reads
`extend(Base, Translation.Translation)` for `extend Translation`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:291`).

`module Translation` (`vendor/rails/v8.0.2/activerecord/lib/active_record/translation.rb:4-21`) defines two
methods, and `extend Translation` gives `Base` both. The trails const holds only `lookupAncestors`:

- `i18n_scope` (`translation.rb:18-20`) is exported from `translation.ts` as `i18nScope` but is not a
  member of the const. `Base` reaches it through a hand-written `static` in `base.ts` that calls
  `Translation.i18nScope.call(this)`.
- `lookup_ancestors` (`translation.rb:6-15`) opens with `return classes if klass == ActiveRecord::Base`.
  trails writes `Object.prototype.hasOwnProperty.call(klass, "_isActiveRecordBase")`, and walks with
  `Object.getPrototypeOf(klass)` where Rails writes `klass.superclass`.

## Acceptance criteria

- [ ] `Translation` is `{ lookupAncestors, i18nScope }`, and `base.ts` carries no hand-written `i18nScope` static.
- [ ] `lookupAncestors` compares against `ActiveRecord.Base` (the namespace seat, CLAUDE.md § "Call-time constant resolution") and steps through the superclass reader Rails names, with Rails' locals.
- [ ] `translation.rb -> translation.ts` stays fully matched; `pnpm parity:api:calls` and `:extra:gate` green; `packages/activerecord/src/i18n.test.ts` stays green.
