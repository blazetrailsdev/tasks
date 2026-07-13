---
title: "Static hasAttribute should resolve attribute aliases like Rails has_attribute?"
status: ready
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' class-level `has_attribute?` resolves attribute aliases before checking
the attribute set:

```ruby
# activerecord/lib/active_record/attribute_methods.rb:254-258
def has_attribute?(attr_name)
  attr_name = attr_name.to_s
  attr_name = attribute_aliases[attr_name] || attr_name
  attribute_types.key?(attr_name)
end
```

Trails' static `hasAttribute` does NOT resolve aliases — it is a bare
membership check:

```ts
// packages/activerecord/src/model-schema.ts:230-232
export function hasAttributeDefinition(this: typeof Base, name: string): boolean {
  return this._attributeDefinitions.has(name);
}
```

So `Post.hasAttribute("comments_count")` returns `false` even though
`aliasAttribute("commentsCount", "legacy_comments_count")` makes it a valid
alias in Rails. PR #4845 (story post-comments-counter-cache-column-alias)
worked around this at ONE call site — `AbstractReflection#hasCachedCounter`
(reflection.ts:487-504) — by wrapping the column in `resolveAliasedColumn`
before the `hasAttribute` check. The associations counter-update path
(associations.ts) already applies the same manual workaround.

The root-cause deviation remains: trails' static `hasAttribute` diverges from
Rails, so every other caller that passes a possibly-aliased name gets a
false negative and must remember to pre-resolve. That is fragile and
un-Rails-like.

Note the camelCase↔snake_case wrinkle documented on `resolveAliasedColumn`
(reflection.ts:150-166): trails' alias KEYS are camelCase (`commentsCount`)
while derived names are snake_case (`comments_count`), so a faithful port of
`attribute_aliases[attr_name] || attr_name` must normalize the lookup key the
way `resolveAliasedColumn` does, not do a raw hash hit. Any fix must handle
both key conventions (Post aliases both `commentsCount` AND `comments_count`
→ `legacy_comments_count`, per test-helpers/models/post.ts:188-190).

## Acceptance criteria

- [ ] `hasAttributeDefinition` / static `hasAttribute` resolves attribute
      aliases (both camelCase and snake_case lookup keys) before checking
      `_attributeDefinitions`, mirroring attribute_methods.rb:254-258.
- [ ] `Post.hasAttribute("comments_count")` returns `true` (aliased to
      `legacy_comments_count`).
- [ ] The manual `resolveAliasedColumn` pre-resolution in
      `hasCachedCounter` (reflection.ts) and the associations counter-update
      path becomes redundant and can be removed (or is proven still needed and
      documented why).
- [ ] No regressions: existing `hasAttribute` callers that pass real column
      names still behave identically.

## Rails source

- `activerecord/lib/active_record/attribute_methods.rb:254-258` — `has_attribute?`
- trails: `packages/activerecord/src/model-schema.ts:230-232`
- trails workaround site: `packages/activerecord/src/reflection.ts:487-504`, `resolveAliasedColumn` at reflection.ts:150-166
