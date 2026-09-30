---
title: "attribute-set-accepts-lazy-attribute-hash"
status: claimed
updated: 2026-09-30
rfc: "0155-assertion-surfaced-port-bugs"
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

Rails' `ActiveModel::AttributeSet` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb`)
duck-types its `@attributes`: every method goes through `@attributes[name]`,
`@attributes.key?`, `@attributes.fetch`, `@attributes.each_value`,
`@attributes.transform_values`, so a `LazyAttributeHash`
(`attribute_set/builder.rb:94-190`) works as its store.
`test_deserializing_rails_v1_mysql_yaml`
(`activerecord/test/cases/yaml_serialization_test.rb:109-116`) depends on that:
the Rails 5.0-era fixture `rails_v1_mysql.yml` dumps
`!ruby/object:ActiveRecord::AttributeSet` whose `attributes:` is a
`!ruby/object:ActiveRecord::LazyAttributeHash`, and `Core#init_with`
hands it straight to `init_with_attributes`.

trails' `AttributeSet` (`packages/activemodel/src/attribute-set.ts`) treats
`_attributes` as a plain `Record<string, Attribute>` (`hasKey(attributes, name)`,
`Object.values(...)`), and its lazy path is the separate `LazyAttributeSet`
subclass. After `psych-object-protocol-for-record-yaml-round-trip` /
`psych-dump-type-constants`, the v1 fixture revives fully
(`ActiveModel::AttributeSet`, `ActiveModel::LazyAttributeHash` with
`_delegateHash` / `additionalTypes` / `defaultAttributes` from their Ruby
ivars), but reading `topic.id` fails with
`this.getAttribute(...).isInitialized is not a function`, because the set
indexes the `LazyAttributeHash` object as if it were a record.

## Acceptance criteria

- [ ] `AttributeSet` reads its store through the `LazyAttributeHash` /
      hash protocol Rails uses (`[]`, `key?`, `fetch`, `each_value`,
      `transform_values`), so a revived `LazyAttributeHash` store answers.
- [ ] `deserializing rails v1 mysql yaml` in
      `packages/activerecord/src/yaml-serialization.test.ts` runs unskipped.
