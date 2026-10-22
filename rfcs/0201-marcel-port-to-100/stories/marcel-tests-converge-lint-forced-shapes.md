---
title: "Converge marcel's test helper extra arm and conditional extension tests to the gem"
status: done
updated: 2026-10-21
rfc: "0201-marcel-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9198
claim: "2026-10-21T22:32:19Z"
assignee: "marcel-parity-enrollment"
blocked-by: null
closed-reason: null
---

## Context

trails#9188 converged marcel's tests onto plain typed TypeScript under the
"no eslint-disable lines" rule, and that left two shapes that differ from the gem:

- `vendor/marcel/v1.0.4/test/test_helper.rb:34-35` destructures
  `_, content_type, extra, _` and runs `extra = nil if content_type[-content_type.size..-1] == extra`.
  `packages/marcel/src/test-helpers/test-helper.ts` (`eachContentTypeFixture`)
  keeps only `const [, contentType] = name.match(...)!` and drops the `extra`
  arm, because `no-useless-assignment` / `prefer-const` red it and inline
  disables are not allowed.
- `vendor/marcel/v1.0.4/test/extension_test.rb:12-23` defines each test inside
  the fixture loop under `unless extensions.include?(extension)`.
  `packages/marcel/src/extension.test.ts` instead collects a
  `Map<extension, contentType>` in the loop and defines the tests in a second
  `for…of`, because `vitest/no-conditional-tests` reds an `if` around `it`.

## Acceptance criteria

- `eachContentTypeFixture` carries the `extra` local and its
  `content_type[-content_type.size..-1] == extra` arm in Ruby's order, with no
  eslint-disable comment (for example, by settling how the lint config treats a
  Rails-mirrored dead assignment in test helpers).
- `extension.test.ts` defines each test inside the fixture loop under the
  `unless extensions.include?` guard, as `extension_test.rb:16-22` does, with no
  eslint-disable comment.
- Test names and count are unchanged (371 passed, 1 skipped).
