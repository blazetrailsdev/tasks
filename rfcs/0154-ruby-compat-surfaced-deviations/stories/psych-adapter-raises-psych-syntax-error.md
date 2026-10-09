---
title: "ruby-compat: the psych adapter raises Psych::SyntaxError, and ConfigurationFile / EncryptedConfiguration rescue it by class"
status: draft
updated: 2026-10-09
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ConfigurationFile#parse` rescues one class:
`rescue Psych::SyntaxError => error`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:37-41`), and re-raises a bare
`raise "YAML syntax error occurred while parsing ..."`.

ruby-compat's psych adapter (`packages/ruby-compat/src/psych-adapter.ts`) re-exports npm `yaml`'s `parse`
and has no `Psych::SyntaxError`. So `packages/activesupport/src/configuration-file.ts#parse` (trails#8733)
recognises the syntax error by duck-typing the npm error: `error instanceof Error && error.name ===
"YAMLParseError"`. `packages/activesupport/src/encrypted-configuration.ts` (its `deserialize`, and
`InvalidContentError`'s constructor) tests the same string for
`rescue Psych::SyntaxError` (`activesupport/lib/active_support/encrypted_configuration.rb`).

## Acceptance criteria

- [ ] ruby-compat's psych module raises a `Psych::SyntaxError` class (a `Psych::Exception`, as in
      `vendor/ruby/v3.3.11/ext/psych/lib/psych/syntax_error.rb`) for a malformed document, wrapping the npm
      parser's error.
- [ ] `ConfigurationFile#parse` and `EncryptedConfiguration` rescue that class with `instanceof`; no
      `error.name === "YAMLParseError"` test is left in activesupport.
- [ ] `packages/activerecord/src/fixture-set/file.trails.test.ts` ("converts the YAML syntax error
      ConfigurationFile raises") still passes.
- [ ] Check `configuration-file-parse-through-psych-unsafe-load` first: if it lands the Psych load path,
      this converges inside it.
