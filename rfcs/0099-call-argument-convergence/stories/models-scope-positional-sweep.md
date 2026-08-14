---
title: "models-scope-positional-sweep"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6502
claim: "2026-08-14T00:57:10Z"
assignee: "models-scope-positional-sweep"
blocked-by: null
closed-reason: null
---

## Context

`call-args-ar-has-many-habtm-scope-positional` (PR #6375) gave `hasMany` and
`hasAndBelongsToMany` Rails' `scope` positional (`associations.rb:1302,1870`),
completing the macro family `belongsTo` / `hasOne` joined in #6373. All four
macros now accept the scope where Rails accepts it.

The canonical test models still overwhelmingly pass the scope in the OPTIONS
BAG (`{ scope: (q) => … }`), which is a trails spelling with no Rails
counterpart — Rails writes every one of them as the positional lambda:

```ruby
# vendor/rails/activerecord/test/models/post.rb:120
has_many :nonexistent_comments, -> { where "comments.id < 0" }, class_name: "Comment"
# vendor/rails/activerecord/test/models/project.rb:5
has_and_belongs_to_many :developers, -> { distinct.order "developers.name desc, developers.id desc" }
```

PR #6375 converted exactly those two declarations — `Post.nonexistentComments`
(`test-helpers/models/post.ts`) and `Project.developers`
(`test-helpers/models/project.ts`) — because they already carry behavioural
coverage for the new positional (`associations/join-model.test.ts` "has many
through uses conditions specified on the has many association" + its eager
counterpart; `associations/eager.test.ts`, `extension.test.ts`,
`callbacks.test.ts`). It deliberately did NOT sweep the rest: `grep -rn
"scope: " packages/activerecord/src/test-helpers/models/*.ts` reports ~176
remaining across 26 model files, which is its own PR.

Every remaining options-bag `scope:` is a silent divergence from the Rails
model file it mirrors, and the two spellings now coexist in the same tree,
which is exactly the "copy the shape next to you" trap CLAUDE.md warns about.

## Acceptance criteria

1. Every `hasMany` / `hasAndBelongsToMany` / `belongsTo` / `hasOne` declaration
   in `packages/activerecord/src/test-helpers/models/**` that passes `scope:` in
   the options bag passes it as Rails' positional instead, matching the
   `has_many` / `has_and_belongs_to_many` line in the corresponding
   `vendor/rails/activerecord/test/models/*.rb`.
2. Where Rails does NOT pass a scope but trails does, the trails scope is
   removed or the divergence is filed — do not preserve it in the new spelling
   without a Rails cite.
3. The options-bag `scope` read in `associations/builder/has-and-belongs-to-many.ts`
   (`positionalScope ?? options.scope`) is narrowed to the positional once no
   canonical model feeds the bag, and the through-routing loaders' `options.scope`
   reads follow.
4. `pnpm parity:api:calls:args` stays green with no new rows; the associations
   suites stay green.
