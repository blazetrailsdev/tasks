---
title: "converge-residual-ar-module-config-to-base"
status: done
updated: 2026-06-25
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4097
claim: "2026-06-25T02:42:34Z"
assignee: "converge-residual-ar-module-config-to-base"
blocked-by: null
---

## Context

`extractor-scan-umbrella-module-config-to-base` (PR pending) made the api-compare
extractor scan the umbrella file `active_record.rb` and attribute its
module-level `singleton_class.attr_accessor`/`attr_reader` config to
`ActiveRecord::Base`, tagged `umbrellaConfig` so compare credits the port
wherever trails actually lands it (Base statics, `ar-config.ts` `setX` setters,
or a feature file). This replaced the hand-maintained `RAILS_AR_MODULE_CONFIG`
allowlist in `scripts/api-compare/extra-surface.ts`.

Most flags are now credited, but ~15 ActiveRecord module-config flags surface as
honest **missing on `base.rb`** because trails exposes no matchable named
static/setter for them. Some are ported in a non-matchable form (object
property, local const, read indirectly); a few are genuinely unported:

- Unported (no trails counterpart at all): `timestamped_migrations`,
  `migration_strategy`, `verify_foreign_keys_for_fixtures`, `use_yaml_unsafe_load`.
- Ported in a non-matchable form: `database_cli`, `async_query_executor`,
  `queues`, `maintain_test_schema`, `belongs_to_required_validates_foreign_key`,
  `application_record_class`, `error_on_ignored_order`, `query_transformers`,
  `raise_int_wider_than_64bit`, `yaml_column_permitted_classes`,
  `generate_secure_token_on`.

Rails declares all of these on the `ActiveRecord` module
(`active_record.rb:182-490`); the Rails-faithful trails surface is a
`Base` static (or an `ar-config.ts` export with a `setX` setter, the pattern
already used for `protocol_adapters`, `disable_prepared_statements`, etc.).

## Acceptance criteria

- Each remaining ActiveRecord module-config flag listed above is ported as a
  Base static or an `ar-config.ts` exported binding + `setX` setter (matching the
  existing ar-config pattern), so `pnpm api:compare --package activerecord
--missing` no longer lists it under `base.rb`.
- Flags with no current trails behavior get a faithful default mirroring Rails'
  (`active_record.rb`), wired where the framework consults them.
- `base.rb` api-compare coverage returns to ~100%.
