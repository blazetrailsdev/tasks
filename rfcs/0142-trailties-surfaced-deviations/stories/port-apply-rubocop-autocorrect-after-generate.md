---
title: "Port apply_rubocop_autocorrect_after_generate! as the ESLint autocorrect pass"
status: ready
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: generators
packages:
  - trailties
deps:
  - railtie-configuration-app-generators
  - map-rubocop-to-eslint-in-token-renames
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Configuration::Generators` was ported to `packages/trailties/src/configuration.ts`
(trails#8180, story `railtie-configuration-app-generators`) without
`apply_rubocop_autocorrect_after_generate!`
(`vendor/rails/v8.0.2/railties/lib/rails/configuration.rb:129-139`):

```ruby
def apply_rubocop_autocorrect_after_generate!
  after_generate do |files|
    parsable_files = files.filter { |file| File.exist?(file) && file.end_with?(".rb") }
    unless parsable_files.empty?
      system(RbConfig.ruby, "bin/rubocop", "-A", "--fail-level=E", "--format=quiet", *parsable_files, exception: true)
    end
  end
end
```

**The open question in the original filing — what it spawns — is now decided:
ESLint.** trails has no RuboCop and never will; `rubocop` → `eslint` is a row in
`TOKEN_RENAMES` (`scripts/parity/conventions.ts`), the same mechanism as
`erb` → `tse`, so this method's TS name is
`applyEslintAutocorrectAfterGenerateBang` and that spelling is what `parity:api`
matches on. See `map-rubocop-to-eslint-in-token-renames`, which must land first.

What that changes in the body, line by line:

- `RbConfig.ruby` + `bin/rubocop` → the generated app's `bin/eslint` binstub, which
  `app-generator-writes-an-eslint-config-instead-of-rubocop-yml` creates. ruby-compat's
  `RbConfig` (`packages/ruby-compat/src/rb-config.ts`) has no `ruby` and does not
  grow one for this.
- `-A --fail-level=E --format=quiet` → the ESLint flags with the same three
  meanings: autofix including unsafe fixes, fail only on errors, quiet output.
  Each mapping is justified at the call site.
- `file.end_with?(".rb")` → the TS extensions ESLint can parse. Rails' filter is
  "files this linter understands", not "Ruby files" incidentally, so the port keeps
  the filter and changes its extension set.
- `exception: true` → the spawn rejects on non-zero, rather than being ignored.

The trailties hard rules forbid `process.*`; `getChildProcess()` (ruby-compat) is
the sanctioned spawn seat, as `generators/actions.ts` uses for `git` / `rake`.

Rails tests: `generators with apply_rubocop_autocorrect_after_generate!` and `... and pretend`
(`railties/test/application/generators_test.rb:260-277`). Their names carry the Ruby
spelling; `parity:test` normalizes both sides through the same token rename, so the
trails tests are spelled with `applyEslintAutocorrectAfterGenerateBang` and still
credit (CLAUDE.md's `ERB` → `TSE` test-name rule).

## Acceptance criteria

- `Generators#applyEslintAutocorrectAfterGenerateBang` is ported in Rails
  declaration order (after `afterGenerate`), registering an `afterGenerate`
  callback that filters existent parsable files and spawns through
  `getChildProcess()` — no `process.*`.
- The four flag/argument mappings above are each cited at the call site; nothing is
  dropped or added silently, and the `pretend` arm still spawns nothing.
- The two Rails tests are ported to
  `packages/trailties/src/application/generators.test.ts` at their renamed-token
  names, and `parity:test` credits them.
- `pnpm parity:api:calls` is clean for `configuration.ts`, or a new row carries a
  reviewed one-line reason — the `system` → `getChildProcess()` substitution is
  exactly the kind of call swap that gate sees.
