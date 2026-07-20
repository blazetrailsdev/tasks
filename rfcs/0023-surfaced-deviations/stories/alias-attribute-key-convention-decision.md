---
title: "Decide alias-attribute key convention: retire the camelCase lookup bridge"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
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

Root-cause deviation surfaced by PR #4980. In Rails, `alias_attribute :new_name,
:name` stores the alias KEY in the same naming convention as column names
(snake_case), so every alias consumer is a plain hash hit:

```ruby
attr_name = attribute_aliases[attr_name] || attr_name
```

Trails stores alias keys camelCase (`newName`, `commentsCount`) per the repo's
camelCase convention, while derived and DB-sourced names stay snake_case
(`new_name`, `comments_count`, counter-cache columns, column names from schema
reflection). Every consumer therefore needs a convention bridge, and any
consumer that forgets one silently returns a false negative rather than
erroring.

PR #4980 addressed this per-consumer via `resolveAliasNameIn`
(`packages/activemodel/src/attribute-methods.ts`), which camelizes the lookup
key as a guarded fallback. That works but leaves the bridge as an ongoing tax:
every new alias consumer must remember it, and each needs its own decision about
which attribute set defines ownership for the guard. Two follow-ups already
exist purely because of this split
(`alias-bridge-remaining-resolve-sites`,
`converge-resolvealiasedcolumn-onto-resolvealiasnamein`).

The alternative — normalizing at declaration time in `aliasAttribute` so
`_attributeAliases` carries both spellings — was evaluated and rejected during
PR #4980: `generateAliasAttributes`
(`packages/activerecord/src/attribute-methods.ts:465`) _enumerates_
`_attributeAliases` to define accessors, so a synthetic snake_case key would
generate a public `post.comments_count` accessor that trails' camelCase
convention does not want. Any declaration-time fix must therefore separate "keys
used for lookup" from "keys used for accessor generation".

This story is the decision + implementation of that separation, retiring the
lookup-time bridge.

## Acceptance criteria

- [ ] Decide and document whether alias lookup keys are normalized at
      declaration time (storing both spellings, or a normalized lookup index
      distinct from the accessor-generation list) or the lookup-time bridge
      stays permanently.
- [ ] If normalized: accessor generation still emits only the declared
      camelCase alias — no invented snake_case public accessors.
- [ ] If normalized: `resolveAliasNameIn`'s camelize fallback is removed and
      `resolveAliasName` becomes the single Rails-exact resolver everywhere.
- [ ] Ownership-precedence behaviour is preserved: a name the relevant
      attribute set already owns (e.g. a projected
      `SELECT COUNT(*) AS comments_count`) is never redirected to an alias.
- [ ] Regression coverage in `attribute-methods.trails.test.ts` continues to
      pass (bridge, has/read/write coherence, both precedence guards).

## Rails source

- `activerecord/lib/active_record/attribute_methods.rb:254-258`, `:316-319` — `has_attribute?`
- `activerecord/lib/active_record/attribute_methods/read.rb:31-34` — `read_attribute`
- `activerecord/lib/active_record/attribute_methods/write.rb:31-34` — `write_attribute`
- `activemodel/lib/active_model/attribute_methods.rb` — `alias_attribute`
- trails: `packages/activemodel/src/attribute-methods.ts` — `aliasAttribute`, `resolveAliasName`, `resolveAliasNameIn`
- trails: `packages/activerecord/src/attribute-methods.ts:465` — `generateAliasAttributes` enumeration constraint
