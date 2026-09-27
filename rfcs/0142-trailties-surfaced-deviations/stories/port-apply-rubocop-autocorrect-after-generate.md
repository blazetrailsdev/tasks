---
title: "port-apply-rubocop-autocorrect-after-generate"
status: ready
updated: 2026-09-27
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: ["railtie-configuration-app-generators"]
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

It shells out through `Kernel#system` to `RbConfig.ruby` and `bin/rubocop`. The trailties hard rules
forbid `process.*`; `getChildProcess()` (ruby-compat) is the sanctioned spawn seat, as
`generators/actions.ts` uses for `git` / `rake`. ruby-compat's `RbConfig`
(`packages/ruby-compat/src/rb-config.ts`) has no `ruby`, and a trails app has no `bin/rubocop` —
the trails analogue of the autocorrect pass is the app's linter.

Rails tests: `generators with apply_rubocop_autocorrect_after_generate!` and `... and pretend`
(`railties/test/application/generators_test.rb:260-277`).

## Acceptance criteria

- `Generators#applyRubocopAutocorrectAfterGenerateBang` is ported in Rails declaration order
  (after `afterGenerate`), registering an `afterGenerate` callback that filters existent files and
  spawns through `getChildProcess()` — no `process.*`.
- The decision on what it spawns (`RbConfig.ruby` + `bin/rubocop` literally, or the generated
  app's linter) is made and cited.
- The two Rails tests are ported to `packages/trailties/src/application/generators.test.ts`.
