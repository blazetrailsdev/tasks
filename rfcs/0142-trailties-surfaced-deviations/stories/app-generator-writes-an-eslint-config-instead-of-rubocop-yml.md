---
title: "App generator writes an ESLint config where Rails writes .rubocop.yml"
status: ready
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages:
  - trailties
deps: [map-rubocop-to-eslint-in-token-renames]
deps-rfc: []
est-loc: 220
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' app generator emits two RuboCop files and gates both on the skip flag:

```ruby
def rubocop                                    # app_generator.rb:92-93
  template "rubocop.yml", ".rubocop.yml"
end

def create_rubocop_file                        # :393-395
  return if skip_rubocop?
  build(:rubocop)
end
```

plus `bin/rubocop` from `templates/bin/rubocop.tt` (loaded through
`Gem.bin_path`), and the binstub exclusion arm
`Regexp.union([… (/rubocop/ if skip_rubocop?), (/brakeman/ if skip_brakeman?)])`
(`:112`). `templates/rubocop.yml.tt` is one line:
`inherit_gem: { rubocop-rails-omakase: rubocop.yml }`.

trails' `app-generator.ts` has none of this. Its `createBinFiles` (`:339`) writes
`bin/trails` and `bin/setup` as inline `createFile` heredocs rather than Thor
templates — the deviation `generators-have-no-thor-source-paths-or-template-files`
owns, so this story follows whatever shape that one lands, and does not introduce a
second template mechanism of its own.

The content question is trails-specific and needs deciding here, not at the call
site: Rails inherits a published style gem (`rubocop-rails-omakase`), and trails
has no equivalent published ESLint config. The options are a generated
`eslint.config.mjs` extending `@blazetrails/eslint-config` (which does not exist
yet), or a self-contained flat config.

## Acceptance criteria

- `createEslintFile` and the `eslint` build action are ported at the names the
  token-rename table produces, in Rails declaration order, gated on the skip flag
  the sibling story adds.
- The generated app gets an ESLint config at the conventional flat-config path and
  a `bin/eslint` binstub in the shape `createBinFiles` already uses for
  `bin/trails` — no new template mechanism.
- The decision on config *content* is recorded in the PR body: extend a published
  trails config, or emit a self-contained one. If it needs a package that does not
  exist, that package is a separate story, not an empty stub here (CLAUDE.md
  forbids placeholder files).
- The binstub exclusion arm is ported with its Rails structure — the `eslint` arm
  beside whatever other arms trails has — rather than collapsed into one condition.
- `bin/eslint` is executable (`mode: 0o755`), as `bin/trails` is.
- The generated app's ESLint run passes on its own generated output: the port of
  `test_generated_files_have_no_rubocop_warnings`
  (`railties/test/generators/shared_generator_tests.rb:387-393`), which is the test
  that makes this worth doing at all.
- Rails' `app_generator_test.rb` arms that assert the files exist (`:14,39`) and are
  skipped (`:618-623,641-644`) are ported with verbatim test names.
