---
title: "Call gate credits a ruby-compat-bound parse as Ruby unsafe_load"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails PR 8476. `ActiveSupport::ConfigurationFile#parse`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:21-45`)
calls `YAML.unsafe_load` / `YAML.load`. trails'
`packages/activesupport/src/configuration-file.ts` calls the npm backend's
`parse`, bound as `yamlParse`, and carried
`@missingRailsCall unsafe_load — CONVERGEABLE configuration-file-parse-through-psych-unsafe-load`.

While `parse` was imported `from "yaml"`, `parity:api:calls` flagged the
omission and the tag was live. Once the same binding came from
`@blazetrails/ruby-compat/psych-adapter`, the gate reported the tag STALE
("the TS body now makes the call") and the tag had to be deleted, although the
body is unchanged and still does not call `Psych.unsafeLoad`.

The crediting path was not traced. `collectRubyCompatBindings`
(`scripts/api-compare/extract-ts-api.ts:4490-4508`) records every named import
from any `@blazetrails/ruby-compat*` specifier, and `recordCallSite` stamps it
on `CallSite.rubyCompat`; something downstream treats that call as answering
`unsafe_load`.

## Acceptance criteria

- [ ] Find the rule that credits a ruby-compat-bound `parse` as Ruby
      `unsafe_load` and state it in the story.
- [ ] A ruby-compat import credits a Ruby call only through its
      `RUBY_COMPAT_EXPORTS` row (`scripts/parity/ruby-compat.ts`); an export
      with no row, such as `psych-adapter`'s `parse`, credits nothing.
- [ ] `configuration-file.ts`'s `parse` is flagged for `unsafe_load` again
      until `configuration-file-parse-through-psych-unsafe-load` converges it,
      with a comparer test pinning the case.
