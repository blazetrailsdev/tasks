---
title: "seat-remaining-qualified-error-classes"
status: ready
updated: 2026-10-19
rfc: "0205-namespace-seats-are-plain-javascript"
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

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
