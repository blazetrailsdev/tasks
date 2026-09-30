---
title: "tag_options expands a ruby-compat Hash under data:/aria: (tag_helper.rb:248-290)"
status: in-progress
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 12
pr: trails#8266
claim: "2026-09-30T09:49:52Z"
assignee: "actionview-rendering-methods-have-no-super-chain"
blocked-by: null
closed-reason: null
---

## Context

Rails' `TagHelper::TagBuilder#tag_options`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tag_helper.rb:248-290`) walks
`options.each_pair` and expands `data:` / `aria:` when `value.is_a?(Hash)` (`:254`, `:260`),
recursing into `Array, Hash` aria values (`:265`) through `TagHelper.build_tag_values`.

trails' `tagOptions` (`packages/actionview/src/helpers/tag-helper.ts`, around `:224-262`)
iterates with `Object.entries(options)`. Its `isPlainObject` test is only `typeof value === "object"`
minus arrays, `SafeBuffer` and `RegExp`, so a ruby-compat `Hash` (a `Map`) under `data:` / `aria:`
counts as a hash, and then `Object.entries(map)` yields `[]`. Every nested attribute is silently
dropped, and a `Hash` passed as the whole `options` renders no attributes at all.

trails#8247 made `FormBuilder#submit` / `FormTagHelper#submit_tag` accept a `Hash` (`is_a?(Hash)`,
`form_helper.rb:2590`) and taught ruby-compat `update` its Map arm (`rb_to_hash_type`,
`vendor/ruby/v3.3.11/hash.c:4028`). A `Hash` nested under `data:` still reaches `tag` and is lost.

## Converged shape

- `tagOptions` iterates `options` with Ruby's `each_pair` semantics for both a plain object and a
  ruby-compat `Hash`, and the `data` / `aria` arms test `value.is_a?(Hash)` (plain object or `Hash`)
  and walk it the same way.
- `buildTagValues`' `Hash` arm (`tag_helper.rb` `build_tag_values`) accepts a `Hash` too.

## Acceptance criteria

- `tag("div", { data: hashOf({ foo: "bar" }) })` renders `data-foo="bar"`. The same holds for
  `aria:`, and for a `Hash` passed as the whole options.
- `submitTag("Save", hashOf({ data: hashOf({ disable_with: "x" }) }))` renders
  `data-disable-with="x"` (`form_tag_helper.rb:1060-1073`).
