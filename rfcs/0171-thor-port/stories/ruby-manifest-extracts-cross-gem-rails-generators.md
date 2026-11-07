---
title: "Ruby manifest extracts lib/rails/generators classes from activerecord/actioncable/activejob/actionmailer"
status: in-progress
updated: 2026-11-07
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9848
claim: "2026-11-07T21:13:13Z"
assignee: "port-integration-system-multidb-actiontext-generators"
blocked-by: null
closed-reason: null
---

## Context

`class-paths-pair-namespaced-generators` cannot pass, because the Ruby
manifest (`scripts/api-compare/output/rails-api.json`, built by
`scripts/api-compare/extract-ruby-api.rb`) has no rows for the generators
that other gems ship under `lib/rails/generators/`, while trailties ports
them in `packages/trailties/src/generators/`:

- `vendor/rails/v8.0.2/activerecord/lib/rails/generators/active_record/{application_record,migration,model}/*_generator.rb` (`ActiveRecord::Generators::*`)
- `vendor/rails/v8.0.2/actioncable/lib/rails/generators/{channel,test_unit/channel}/channel_generator.rb`
- `vendor/rails/v8.0.2/activejob/lib/rails/generators/job/job_generator.rb`
- `vendor/rails/v8.0.2/actionmailer/lib/rails/generators/mailer/mailer_generator.rb`

Measured with `"generators/"` added to `LAZY_DIRS.trailties` in
`scripts/api-compare/class-paths.ts`: `parity:class-paths:check` reports these
as "new walked export with no Ruby counterpart". There are two further misses:
`Rails::Generators::AppGenerator` is recorded with file
`commands/application/application_command.rb` (a reopening), not
`generators/rails/app/app_generator.rb`. `Rails::Generators::Base` and
`Rails::Generators::Error` (`generators/base.rb`) do not resolve to the TS
renames `GeneratorBase` and `GeneratorError`.

## Acceptance criteria

- The Ruby extractor records each gem's `lib/rails/generators/**` classes under the `trailties` package, with their real file paths.
- `AppGenerator` pairs with `generators/rails/app/app_generator.rb`.
- `GeneratorBase` / `GeneratorError` are renamed to `Base` / `Error`, or are paired by file. No `@noRailsEquivalent` is added.
- The `pnpm parity:api` deltas stay non-negative.
