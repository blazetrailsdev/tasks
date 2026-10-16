---
title: "update_columns builds {} as Rails does; _update_record's transform_keys keeps Arel-attribute keys"
status: done
updated: 2026-10-16
rfc: "0190-native-js-hash-forms"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8959
claim: "2026-10-15T22:44:50Z"
assignee: "update-columns-builds-plain-object-arel-boundary-rekeys"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/persistence.ts` `updateColumns` builds a ruby-compat `Hash` where Rails builds `{}`:
`attributes.each_with_object({}) { |(k, v), h| h[k] = @attributes.write_cast_value(k, v); clear_attribute_change(k) }`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:616-619`). trails#8951 left it as a `Hash` because the consumer `_updateRecord`
re-keys the value with `values.transform_keys { |name| arel_table[name] }` (`persistence.rb:263-275`). Those keys are Arel attribute objects, and
`transformKeys` (`packages/activesupport/src/hash-utils.ts:283-306`) stringifies them on its plain-object arm.

## Acceptance criteria

- [ ] `updateColumns` builds a plain `{}` with `h[k] = ...`, as Rails does.
- [ ] `_updateRecord`'s `transform_keys` still produces object-keyed values for `UpdateManager#set`. Either `transformKeys` answers a `Hash` when the block yields a non-string key, or the Arel boundary takes the pairs. No extra helper.
- [ ] `pnpm parity:api:calls` and `calls:args` green with no baseline row added.
