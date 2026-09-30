---
title: "Port Psych.load_tags / dump_tags / domain_types and add_tag / add_builtin_type / add_domain_type / remove_type"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["move-activesupport-yaml-into-ruby-compat-psych"]
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/ext/psych/lib/psych.rb:676-692` (`add_domain_type`, `add_builtin_type`,
`remove_type`, `add_tag`) and `:697-738` (the `load_tags` / `dump_tags` /
`domain_types` accessors). Readers: `ToRuby` `@load_tags`
(`to_ruby.rb:27,52,134,166-167`) and `YAMLTree` `Psych.dump_tags[o.class]`
(`yaml_tree.rb:153,377,499`). Rails writes them at module load:
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:1063-1064`,
`vendor/rails/v8.0.2/activesupport/lib/active_support/time_with_zone.rb:608-609`,
`vendor/rails/v8.0.2/activerecord/lib/active_record.rb:570-573` and
`vendor/rails/v8.0.2/activesupport/lib/active_support/ordered_hash.rb:5`.

Moved out of `psych-scalar-and-tag-visitors`' second bullet. Four consumer
stories depend on it.

## Acceptance criteria

- [ ] The tables are module-level `Psych.loadTags` / `Psych.dumpTags` /
      `Psych.domainTypes`, with the setters Ruby's `attr_accessor` gives. They
      are reachable and writable **without the backend** (RFC §3). A test runs
      with the adapter unregistered.
- [ ] `addTag`, `addBuiltinType`, `addDomainType` and `removeType` are ported,
      and `ToRuby` / `YAMLTree` consult the tables at the Rails lines above.
- [ ] Tests and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
