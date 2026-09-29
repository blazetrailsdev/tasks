---
title: "psych-scalar-and-tag-visitors"
status: draft
updated: 2026-09-29
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`psych-object-protocol-for-record-yaml-round-trip` ported the object half of
Psych into `packages/activesupport/src/yaml.ts`: `YAMLTree#accept` dispatches
`encode_with`, Class, Array, Hash and the `visit_Object` ivar fallback, and
`ToRuby` revives `!ruby/object:` mappings, `!ruby/class` / `!ruby/module`
scalars and plain hashes / sequences / scalars. The rest of Psych's dispatch
tables are not ported, and each gap currently falls through silently:

- `YAMLTree` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/yaml_tree.rb`):
  `visit_Time`, `visit_DateTime`, `visit_Date`, `visit_Symbol`,
  `visit_String` (quoting / binary), `visit_Integer` / `visit_BigDecimal`,
  `visit_Rational`, `visit_Range`, `visit_Regexp`, `visit_Struct`,
  `visit_Hash` for a Hash subclass (`!ruby/hash:` / `!ruby/hash-with-ivars:`),
  and `visit_Array` subclasses. A trails `Time` / `DateTime` / `TimeWithZone`
  currently falls to `visit_Object` and dumps its internal fields as
  `!ruby/object:…`.
- `Psych.dump_tags` / `Psych.load_tags`: Rails registers `load_tags` for its
  legacy class names at `activerecord/lib/active_record.rb:570-572`.
- `emit_coder`'s `:scalar`, `:seq` and `:object` arms and `Coder#represent_*`
  (`psych/coder.rb`); only `:map` is ported. `Relation#encode_with`
  (`relation.rb:348`, `coder.represent_seq`) needs `:seq`.
- `ToRuby#deserialize` (`to_ruby.rb:45-127`) tag arms (`!ruby/symbol`,
  `!ruby/regexp`, `!ruby/range`, `!ruby/object:BigDecimal`, …) and
  `visit_Psych_Nodes_Mapping` (`to_ruby.rb:231-330`) arms (`!ruby/hash:`,
  `!ruby/struct:`, `!ruby/exception`, `!ruby/object:` on a scalar or sequence).
  These currently return the plain value.

## Acceptance criteria

- [ ] Each arm above is ported at its Psych name, or raises where the tag
      cannot be revived, instead of falling through.
- [ ] `to yaml with time with zone should not raise exception`
      (`yaml-serialization.test.ts`) dumps `written_on` as a timestamp scalar,
      not an ivar mapping.
