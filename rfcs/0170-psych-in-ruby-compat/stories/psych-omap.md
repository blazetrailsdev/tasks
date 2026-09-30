---
title: "Port Psych::Omap and its !omap load/dump arms"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["psych-load-tags-dump-tags-and-domain-types"]
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

`vendor/ruby/v3.3.11/ext/psych/lib/psych/omap.rb:3` `class Omap < ::Hash`. `ToRuby` builds it for
`!omap` / `tag:yaml.org,2002:omap` sequences and mappings
(`psych/visitors/to_ruby.rb:149,292-293`), and `YAMLTree#visit_Psych_Omap`
(`yaml_tree.rb:139-151`) emits it. Callers:
`vendor/rails/v8.0.2/activerecord/lib/active_record/fixture_set/file.rb:77`
(`YAML::Omap === data`) and `vendor/rails/v8.0.2/activesupport/lib/active_support/ordered_hash.rb:5-31`.
`Psych::Set` (`set.rb`) has no trails caller and is excluded (rule 1).

## Acceptance criteria

- [ ] `Psych.Omap` is an ordered Hash: a subclass of ruby-compat `Hash` if
      one exists, else a `Map` subclass. `ToRuby` revives `!omap` to it and
      `YAMLTree` dumps it as `!omap` pairs.
- [ ] Tests and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
