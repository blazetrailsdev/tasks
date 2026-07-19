---
title: "Converge ActiveSupport MissingTranslationData#message to i18n gem two-branch format"
status: claimed
updated: 2026-07-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-19T21:11:09Z"
assignee: "activesupport-missing-translation-message-options-branch"
blocked-by: null
closed-reason: null
---

## Context

PR #4942 (RFC 0025 bare-throw burndown continue-5) ported activemodel's
`MissingTranslationData` to faithfully reproduce the i18n gem's two-branch
`MissingTranslation::Base#message` (`i18n/lib/i18n/exceptions.rb:63-68`):

- non-empty `default` chain → `Translation missing. Options considered were:\n- <key>...`
- no default → `Translation missing: <locale>.<key>`

The **ActiveSupport** `MissingTranslationData` (`packages/activesupport/src/i18n.ts:240-249`)
and the missing-translation string return (`i18n.ts:302`) still emit only the
single-branch `Translation missing: ${locale}.${key}` shape — it never lists the
considered keys when a `default` chain was supplied, so it diverges from the
i18n gem message that activemodel now matches.

## Acceptance criteria

- [ ] `packages/activesupport/src/i18n.ts` `MissingTranslationData#message`
      reproduces the i18n gem two-branch format (Options-considered listing when
      a non-empty `default` array is passed; bare otherwise), matching the
      activemodel port in `packages/activemodel/src/i18n.ts`.
- [ ] The `raise: false` string-return path (`i18n.ts:302`) stays consistent
      with the chosen message shape.
- [ ] Tests in `packages/activesupport/src/i18n.test.ts` assert both branches
      verbatim; api:compare/test:compare delta non-negative.
