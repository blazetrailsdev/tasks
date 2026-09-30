---
title: "Port Psych::Exception and Psych::SyntaxError; backend parse errors raise it"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat", "activesupport"]
deps: ["move-activesupport-yaml-into-ruby-compat-psych"]
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

`vendor/ruby/v3.3.11/ext/psych/lib/psych/exception.rb:3` `class Exception < RuntimeError`;
`psych/syntax_error.rb:5-21` `SyntaxError < Psych::Exception` with `file`,
`line`, `column`, `offset`, `problem`, `context`, and the message
`"(#{file}): #{problem} at line #{line} column #{col}"`
(`syntax_error.rb:8-19`). Rails rescues it at
`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:37` and
`encrypted_configuration.rb:42,122`. trails matches
`e.name === "YAMLParseError"` from the npm package instead
(`activesupport/src/encrypted-configuration.ts:12,121`) and catches everything
in `configuration-file.ts`.

## Acceptance criteria

- [ ] `Psych.Exception` extends ruby-compat `RuntimeError`, and
      `Psych.SyntaxError` extends it with the six readers and Ruby's message
      (the `<unknown>` file when `filename` is nil, `syntax_error.rb:9`).
- [ ] Every Psych load entry point wraps the backend's parse error in
      `Psych.SyntaxError`, with line/column from the backend (1-based, as
      libyaml reports them).
- [ ] `BadAlias` and `DisallowedClass` are re-parented under
      `Psych.Exception` as `exception.rb` has them.
- [ ] No `"YAMLParseError"` string remains in `packages/*/src` (encrypted
      configuration is converged by its own story; this one only makes the
      class exist and be raised).

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
