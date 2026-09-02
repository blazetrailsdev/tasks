---
title: "extract-ruby-api.rb skips the paren-less `CONST = Struct.new :a, :b` command form"
status: ready
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while completing `extract-ruby-api-records-struct-new-members` (PR #7341), which taught `scripts/api-compare/extract-ruby-api.rb` to record the
members of a blockless `CONST = Struct.new(:a, :b)` alongside the already-handled
`Struct.new(...) do … end` form.

`struct_new_call` (`extract-ruby-api.rb`) matches the RHS only when it is a
`:method_add_arg` node — the **parenthesised** call. Ruby's paren-less command
form parses as `:command_call` instead:

```ruby
Ripper.sexp("X = Struct.new :a, :b")
# [:assign, [:var_field, [:@const, "X"]],
#   [:command_call, [:var_ref, [:@const, "Struct"]], [:@period, "."],
#    [:@ident, "new"], [:args_add_block, [...], false]]]
```

so it falls through to the plain-descent arm and contributes nothing — the same
blind spot #7341 closed for the paren form, still open for this one.

Three live instances, each with a real TS port whose members are therefore
uncounted:

- `actionpack/lib/action_dispatch/http/response.rb:434`
  `ContentTypeHeader = Struct.new :mime_type, :charset`
  -> `packages/actionpack/src/action-dispatch/http/response.ts:47`
- `actionpack/lib/action_dispatch/routing/route_set.rb:384`
  `Config = Struct.new :relative_url_root, :api_only, :default_scope`
- `rack/lib/rack/multipart/parser.rb:77`
  `MultipartInfo = Struct.new :params, :tmp_files`
  -> `packages/rack/src/multipart/parser.ts:44`

Verified absent: `ruby -e 'ex.process_file(".../http/response.rb", root)'` yields
no `ContentTypeHeader` class at all.

Note the `class X < Struct.new :a, :b` form (arel/attributes/attribute.rb:5) is
already handled — `process_class` -> `synthesize_struct_members` reads the
superclass node directly and never goes through `struct_new_call`. This story is
only about the `CONST =` assignment form.

## Converged shape

Extend `struct_new_call` to accept the `:command_call` shape beside
`:method_add_arg`, returning the same node `struct_member_names` /
`keyword_init?` already walk. Both existing arms (bare and `do … end`) keep
working unchanged; the block-suffixed command form
(`X = Struct.new :a do … end`) parses as `:method_add_block` wrapping a
`:command_call`, so the existing `rhs[0] == :method_add_block ? rhs[1] : rhs`
unwrapping should cover it once the inner match is widened.

Keep the existing scope discipline: inline symbols and a `*CONST` symbol-array
splat only, never a dynamic member list.

## Acceptance criteria

- [ ] `ContentTypeHeader = Struct.new :mime_type, :charset`
      (`response.rb:434`) contributes `mime_type`, `charset`, their writers and
      `initialize` to `ContentTypeHeader`'s Ruby surface in `rails-api.json`.
- [ ] `Config` (`route_set.rb:384`) and `MultipartInfo`
      (`rack/multipart/parser.rb:77`) likewise.
- [ ] The paren form, the `do … end` form and `class X < Struct.new :a` keep
      recording exactly what they record today.
- [ ] A case in `extract-ruby-api.test.ts`'s "Ruby extractor Struct.new members"
      describe pins the command-form arm.
- [ ] Record the `pnpm parity:api` method/file delta; non-negative. Expect
      actionpack and rack extra-surface `total` to FALL as the TS ports start
      matching — tighten with `pnpm parity:api:extra:tighten`, never a raise.
