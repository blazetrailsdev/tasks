---
title: "api-compare: String#foo in core_ext/string/inflections.rb is compared against the Inflector.foo body"
status: draft
updated: 2026-10-09
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found in trails#8729. `RUBY_FILE_TS_OVERRIDES` (`scripts/parity/conventions.ts`) maps
`activesupport:core_ext/string/inflections.rb` to `inflector.ts`, so every `String#foo` in that file is paired
with the `Inflector.foo` body ported from `inflector/methods.rb`. Rails' `String#foo` bodies are one-line
delegations (`ActiveSupport::Inflector.titleize(self, keep_id_suffix: keep_id_suffix)`,
`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/string/inflections.rb`), so the call and arm
comparisons for those pairs measure the wrong body. trails#8729 made the skeleton writer read the file the
`.rb` path mirrors when it holds the name's one body, which fixed `camelize` and `pluralize`
(`packages/activesupport/src/core-ext/string/inflections.ts`). The other fifteen (`singularize`, `constantize`,
`safe_constantize`, `titleize`, `underscore`, `dasherize`, `demodulize`, `deconstantize`, `parameterize`,
`tableize`, `classify`, `humanize`, `upcase_first`, `downcase_first`, `foreign_key`) still pair with
`inflector.ts`, and the mirror-file read applies to the skeleton rows only, not to the call-set or call-argument
gates.

## Acceptance criteria

- [ ] Each `String#foo` in `core_ext/string/inflections.rb` is compared against a port of that method, or is
      recorded as having no separate TS member, and is not compared against the `Inflector.foo` body.
- [ ] The call-set and call-argument gates use the same pairing the skeleton writer does.
- [ ] `pnpm parity:api` deltas are non-negative.
