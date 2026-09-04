---
title: "Port Rails::Generators::Testing::Assertions instead of hand-rolled file assertions"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Testing::Assertions`
(`vendor/rails/railties/lib/rails/generators/testing/assertions.rb`) is the
module every generator test asserts through — `assert_file`,
`assert_no_file`, `assert_directory`, `assert_migration`,
`assert_no_migration`, `assert_field_type`, `assert_field_default_value`,
`assert_instance_method`, `assert_class_method`. trails has none of it.

`assert_file` (`assertions.rb:25-39`) is the load-bearing one:

```ruby
def assert_file(relative, *contents)
  absolute = File.expand_path(relative, destination_root)
  assert File.exist?(absolute), "Expected file #{relative.inspect} to exist, but does not"

  read = File.read(absolute) if block_given? || !contents.empty?
  assert_nothing_raised { yield read } if block_given?

  contents.each do |content|
    case content
    when String
      assert_equal content, read
    when Regexp
      assert_match content, read
    end
  end
end
alias :assert_directory :assert_file
```

PR #7362 ported it as a **test-local helper** inside
`packages/trailties/src/generators/app-generator.test.ts` rather than as the
module, because it was needed to land `it("name option")` and a full module
port was out of that PR's scope. Every other trailties generator test still
hand-rolls `fs.readFileSync` + `expect(...).toMatch(...)`.

That has a measured cost beyond duplication. `parity:test`'s assertion-kind
comparer maps a trails callee back through `camelToSnake`
(`scripts/test-compare/assertion-kinds.ts`, `normalizeTrailsKind`), so an
`assertFile(...)` call resolves to `assert_file` and lines up with the Rails
side — both unmapped, no mismatch. A hand-rolled `expect(...).toMatch(...)`
resolves to kind `match` against a Rails side that has none, which the
assertion-mismatch ratchet counts as new kind debt. #7362's first CI red was
exactly this, and every future generator-test port hits it the same way.

## Converged shape

`packages/trailties/src/generators/testing/assertions.ts`, mirroring the
Rails file and its member order, with the Rails names. Ruby's block form
(`assert_file path do |content| ... end`) is a callback parameter. Then
delete the test-local `assertFile` in `app-generator.test.ts` and move the
existing generator tests onto the module.

## Acceptance criteria

- `assertFile` / `assertNoFile` / `assertDirectory` / `assertMigration` /
  `assertNoMigration` are ported with Rails' names, parameter names, defaults
  and bodies; `assertDirectory` aliases `assertFile` as Ruby does.
- `app-generator.test.ts`'s local `assertFile` is deleted in favor of it.
- Generator tests that hand-roll `readFileSync` + `toMatch` assert through
  the module instead.
- `pnpm parity:test:assertions` does not grow; the trailties
  assertion-kind-mismatch count should FALL as tests move onto the helper.
