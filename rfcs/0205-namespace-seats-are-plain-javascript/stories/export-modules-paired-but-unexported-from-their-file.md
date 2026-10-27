---
title: "export-modules-paired-but-unexported-from-their-file"
status: draft
updated: 2026-10-27
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

`pnpm parity:class-paths:check` (`scripts/api-compare/class-paths.ts`, trails#9376) pairs Ruby modules from `rails-api.json` with TS classes, modules, `export const` and `export namespace` bindings. It then prints, without failing, each paired Ruby module whose TS form has no exported binding a generated table can name (`mN.Name`). These modules have no generated class path, so `rbModName` answers `klass.name` or `null` for them. Rails' `rb_mod_name` (`vendor/ruby/v3.3.11/variable.c:122`) answers the full path.

The list as of trails#9376:

- activerecord/src/attribute-methods.ts: AttributeMethods (ActiveRecord::AttributeMethods)
- activerecord/src/attributes.ts: Attributes (ActiveRecord::Attributes)
- activerecord/src/callbacks.ts: ClassMethods (ActiveRecord::Callbacks::ClassMethods)
- activerecord/src/connection-adapters/abstract/connection-pool.ts: AbstractPool (ActiveRecord::ConnectionAdapters::AbstractPool)
- activerecord/src/migration/compatibility.ts: LegacyIndexName (ActiveRecord::Migration::Compatibility::V7_0::LegacyIndexName)
- activerecord/src/migration/compatibility.ts: CommandRecorder (ActiveRecord::Migration::Compatibility::V5_2::CommandRecorder)
- activerecord/src/querying.ts: Querying (ActiveRecord::Querying)
- activerecord/src/runtime-registry.ts: RuntimeRegistry (ActiveRecord::RuntimeRegistry)
- activerecord/src/secure-password.ts: SecurePassword (ActiveRecord::SecurePassword)
- activerecord/src/serialization.ts: Serialization (ActiveRecord::Serialization)
- activerecord/src/suppressor.ts: Suppressor (ActiveRecord::Suppressor)
- activemodel/src/attribute-assignment.ts: AttributeAssignment (ActiveModel::AttributeAssignment)
- activemodel/src/lint.ts: Lint (ActiveModel::Lint)
- activemodel/src/type.ts: Type (ActiveModel::Type)
- activemodel/src/validations/clusivity.ts: Clusivity (ActiveModel::Validations::Clusivity)
- activemodel/src/validations/comparability.ts: Comparability (ActiveModel::Validations::Comparability)
- activemodel/src/validations/resolve-value.ts: ResolveValue (ActiveModel::Validations::ResolveValue)
- activesupport/src/configurable.ts: ClassMethods (ActiveSupport::Configurable::ClassMethods)
- activesupport/src/core-ext/date-and-time/calculations.ts: Calculations (DateAndTime::Calculations)
- activesupport/src/core-ext/date-and-time/compatibility.ts: Compatibility (DateAndTime::Compatibility)
- activesupport/src/core-ext/date-and-time/zones.ts: Zones (DateAndTime::Zones)
- activesupport/src/dependencies/autoload.ts: Autoload (ActiveSupport::Autoload)
- activesupport/src/lazy-load-hooks.ts: LazyLoadHooks (ActiveSupport::LazyLoadHooks)
- activesupport/src/testing/deprecation.ts: Deprecation (ActiveSupport::Testing::Deprecation)
- actionpack/src/action-dispatch/http/filter-parameters.ts: FilterParameters (ActionDispatch::Http::FilterParameters)
- actionpack/src/action-controller/metal/http-authentication.ts: Basic (ActionController::HttpAuthentication::Basic)
- actionpack/src/action-controller/metal/http-authentication.ts: ClassMethods (ActionController::HttpAuthentication::Basic::ControllerMethods::ClassMethods)
- actionpack/src/action-controller/metal/http-authentication.ts: Digest (ActionController::HttpAuthentication::Digest)
- actionpack/src/action-controller/metal/http-authentication.ts: Token (ActionController::HttpAuthentication::Token)
- actionpack/src/action-controller/metal/request-forgery-protection.ts: ClassMethods (ActionController::RequestForgeryProtection::ClassMethods)
- actionpack/src/action-controller/metal/request-forgery-protection.ts: ProtectionMethods (ActionController::RequestForgeryProtection::ProtectionMethods)
- activejob/src/queue-adapters.ts: QueueAdapters (ActiveJob::QueueAdapters)
- trailties/src/command.ts: Command (Rails::Command)
- trailties/src/command/behavior.ts: Behavior (Rails::Command::Behavior)
- trailties/src/trailtie/configurable.ts: Configurable (Rails::Railtie::Configurable)
- rack/src/mime.ts: Mime (Rack::Mime)
- thor/src/line-editor.ts: LineEditor (Thor::LineEditor)
- thor/src/shell/terminal.ts: Terminal (Thor::Shell::Terminal)
- thor/src/util.ts: Util (Thor::Util)
- i18n/src/locale/tag/parents.ts: Parents (I18n::Locale::Tag::Parents)
- i18n/src/utils.ts: Utils (I18n::Utils)

## Acceptance criteria

- [ ] Each listed module is exported under its Rails name from the file that mirrors its `.rb`, as a plain-object module, class or namespace, so the generated table names it.
- [ ] The modules list in `parity:class-paths:check` is empty, and the check then fails on any paired module it would list (gate it like classes).
