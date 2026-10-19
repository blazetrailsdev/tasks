---
title: "seat-remaining-qualified-error-classes"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
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

trails#9074 switched `ExceptionWrapper` / `Instrumentation#process_action` from the
invented `classNameOf` (which read `error.name`) to `rbObjClassname`, the port of
`exception.class.name` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/exception_wrapper.rb:52`).
That PR path-seated every class keyed in `rescue_responses` / `rescue_templates`, plus the direct
`ActiveRecord::*` / `ActionDispatch::*` errors. These classes still set a qualified `this.name`
but are not seated with `rbModConstSet`, so `rbObjClassname` answers the bare JS name in the
debug page and in the `process_action` log:

- activerecord nested: `AttributeMethods::Serialization::ColumnNotSerializableError`,
  `ConnectionAdapters::PostgreSQL::Quoting::IntegerOutOf64BitRange`,
  `DatabaseConfigurations::InvalidConfigurationError`, `FixtureSet::TableRow::PrimaryKeyError`,
  `Fixture::FixtureError` / `FormatError`, `FutureResult::Canceled`,
  `NestedAttributes::TooManyRecords`, `SecureToken::MinimumLengthError`, `Tasks::DatabaseNotSupported`
- activesupport: `ConfigurationFile::FormatError`, `EncryptedConfiguration`, `OrderedOptions`,
  `InheritableOptions`
- ruby-compat: Psych exceptions, `URI::InvalidURIError` / `InvalidComponentError` / `BadURIError`
- nokogiri: CSS/XML/XPath `SyntaxError`, `Tokenizer::ScanError`, `Racc::ParseError`
- i18n `Locale::Fallbacks`, date `Date::Error`

## Acceptance criteria

- Each class above is seated with `rbModConstSet` under its Ruby parent (the parent seated first), so
  `rbObjClassname` answers the path its `this.name` spells.
- A regression test per package asserts `rbObjClassname` on an instance of each one.
