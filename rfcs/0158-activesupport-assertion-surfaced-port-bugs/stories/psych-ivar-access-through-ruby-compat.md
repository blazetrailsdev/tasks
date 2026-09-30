---
title: "Psych dump_ivars/init_with read and write ivars through ruby-compat accessors"
status: in-progress
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8276
claim: "2026-09-30T01:41:11Z"
assignee: "mysql-bigint-registers-rails-type-integer"
blocked-by: null
closed-reason: null
---

## Context

Psych dumps an object's instance variables by their literal names and sets
them back verbatim: `YAMLTree#dump_ivars` iterates `target.instance_variables`
(`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb:532-537`),
and `ToRuby#init_with` calls `o.instance_variable_set(:"@#{k}", v)`
(`visitors/to_ruby.rb:412-420`).

JS has no separate ivar namespace, so #8254 (`packages/activesupport/src/yaml.ts`)
maps Ruby ivar names onto trails field names by the repo's naming rule.
`dumpIvars` emits `underscore(field.replace(/^_/, ""))`. The ivar fallback in
`ToRuby.initWith` writes `camelize(ivar)`, prefixed with `_` when the class
answers that name as a member (the attr_reader-over-private-field idiom).
Review flagged that the load side decides from `name in o` rather than from a
declared mapping.

## Converged shape

Make the mapping declarative, not inferred: ruby-compat gains
`rbIvarGet` / `rbIvarSet` / `rbObjInstanceVariables` (`object.c`
`rb_ivar_get` / `rb_ivar_set` / `rb_obj_instance_variables`), backed by the
same Ruby→TS field-name rule, and consulted by both `dumpIvars` and
`init_with`. Classes whose ivar spelling differs from the rule declare it once,
next to the class, rather than having `yaml.ts` guess from the member table.

## Acceptance criteria

- [ ] `YAMLTree#dump_ivars` and `ToRuby#init_with` go through the ruby-compat ivar accessors.
- [ ] No `name in o` inference remains in `yaml.ts`.
- [ ] `yaml.trails.test.ts`, `yaml-serialization.test.ts` and `store.test.ts` stay green.
