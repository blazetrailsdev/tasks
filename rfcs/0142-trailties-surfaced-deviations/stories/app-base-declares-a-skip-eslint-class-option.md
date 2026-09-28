---
title: "AppBase declares a skip-eslint class option"
status: in-progress
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages:
  - trailties
deps: [map-rubocop-to-eslint-in-token-renames]
deps-rfc: []
est-loc: 160
priority: 2
pr: trails#8205
claim: "2026-09-28T02:08:21Z"
assignee: "app-base-declares-a-skip-eslint-class-option"
blocked-by: null
closed-reason: null
---

## Context

Rails declares the flag once and reads it through a predicate:

```ruby
class_option :skip_rubocop, type: :boolean, default: nil,  # app_base.rb:100
             desc: "Skip RuboCop setup"
def skip_rubocop?                                          # :392-393
  options[:skip_rubocop]
end
```

It is also carried across `app:update` (`app_generator.rb:316` lists
`:skip_rubocop` among the preserved options) and inferred from the Gemfile by
`update_command.rb:76`'s `skip_rubocop: skip_gem?("rubocop")`.

trails' `app-base.ts` does not model each `skip_x?` as its own method. It has a
`Skip` union (`:5-18`) read by a single generic `skip(what: Skip): boolean`
(`:63-65`) over an index signature `[k: \`skip${string}\`]: boolean | undefined`
(`:26`) — a pre-existing deviation from Rails' one-method-per-flag shape, and NOT
one this story converges. The work here is to add the flag to the existing
mechanism.

That union is also missing `Rubocop`, `Brakeman`, `CI`, `Docker`, `Kamal`,
`Thruster` and `Solid`-adjacent Rails 8 flags (`app_base.rb:96-108`). Only the
ESLint one is in scope; the others are stated here so a reader can file them
rather than assume they were considered and rejected.

## Acceptance criteria

- The `Skip` union gains its ESLint arm and the class option is declared at the
  Rails name the token-rename table produces, with Rails' `type`, `default: nil`
  and `desc` (the description text says ESLint, since that is what it skips).
- `nil` default semantics are preserved, not collapsed to `false`: Rails
  distinguishes "not passed" from "passed false", which is what `app:update`'s
  preservation reads (CLAUDE.md § kwargs / `fetch` vs `??`).
- The CLI accepts `--skip-eslint`, and the flag reaches `trails new` through
  whatever seam `wire-generator-class-options-through-trails-generate` and
  `move-hand-written-generate-subcommand-flags-onto-generators` established — no
  second flag-parsing path.
- The option is in the `app:update`-preserved list, mirroring `:316`.
- `update_command.rb:76`'s `skip_gem?("rubocop")` inference is ported as the
  package-manifest equivalent, or its omission carries a receipt naming why.
- Rails' `test_app_update_preserves_skip_rubocop` (`:297-301`) and
  `assert_option :skip_rubocop` (`:1280`) are ported with verbatim test names.
