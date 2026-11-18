---
title: "i18n: reword the permanently unportable exclusions to PERMANENT receipts citing their CLAUDE.md sections"
status: done
updated: 2026-11-18
rfc: "0245-i18n-test-parity-100"
cluster: residuals
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10278
claim: "2026-11-17T22:36:39Z"
assignee: "i18n-permanent-unportable-receipts"
blocked-by: null
closed-reason: null
---

## Context

The RFC's "Permanently unportable tests" table lists each Ruby test that a
ratified section rules out. Several of the matching exclusions in
`scripts/parity/unported-files/i18n.ts` say "Pre-1.0: optional backend
mixin", which reads as deferred, not permanent:

- `backend/metadata.rb` / `backend/metadata_test.rb` (`i18n.ts`, "attaches
  lookup metadata onto the translated String's singleton class") falls under
  § "Ruby Strings are JS string primitives (no mutable String carrier)" and
  § "Core extensions are not installed on native prototypes"
  (`vendor/i18n/v1.14.8/lib/i18n/backend/metadata.rb:23-36`).
- `api/all_features_test.rb` includes `I18n::Backend::Cache` and `Metadata`
  (`vendor/i18n/v1.14.8/test/api/all_features_test.rb:11-18`). It falls under packages/i18n/CLAUDE.md
  § "A translation lookup is synchronous; the load is an awaited step" and the
  Strings section.
- The `backend/transliterator_test.rb` row for the test
  "default transliterator raises errors for invalid UTF-8" (`baseline.json`) should cite § "A String has no
  encoding tag either".
- `backend/interpolation_compiler.rb` waits on RFC Open question 2. Leave its
  row unchanged until the operator rules.

## Acceptance criteria

- [ ] Each reason above starts `PERMANENT:` and cites its section by exact title.
- [ ] No row is deleted and no test is added. This is a wording change to
      existing exclusions, so the population does not change.
