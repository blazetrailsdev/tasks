---
title: "Give ActiveJob's classes their Ruby constant names so job_class / _aj_serialized round-trip through constantize"
status: in-progress
updated: 2026-10-07
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob", "activesupport"]
deps: ["port-activejob-namespace-and-base"]
deps-rfc: []
est-loc: 250
priority: 3
pr: trails#8648
claim: "2026-10-07T17:49:09Z"
assignee: "register-activejob-constants-for-class-name-round-trip"
blocked-by: null
closed-reason: null
---

## Context

Job data names classes by their Ruby constant path and resolves them again
with `constantize`:

- `Core#serialize` writes `"job_class" => self.class.name` (`vendor/rails/v8.0.2/activejob/lib/active_job/core.rb:109`);
  `Core::ClassMethods#deserialize` does `job_data["job_class"].constantize.new`
  (`:63`).
- `ObjectSerializer#serialize` writes `"_aj_serialized" => self.class.name`
  (`serializers/object_serializer.rb:40`), e.g.
  `"ActiveJob::Serializers::SymbolSerializer"`, and
  `Serializers.deserialize` resolves it with `safe_constantize`
  (`serializers.rb:43`).
- `ActiveJob.adapter_name` reads `adapter_class.name.demodulize`
  (`queue_adapter.rb:11`), and log lines interpolate `job.class` / `ex.class`
  (`log_subscriber.rb:15,112`).

A JS class's `name` is only its last segment (`"SymbolSerializer"`), and
trails' `constantize` (`packages/activesupport/src/inflector.ts:212`) resolves
only names registered with `registerConstant` or reachable by walking
namespace seats. activerecord solves the model half with explicit
`registerModel` (`packages/activerecord/src/associations.ts:150`).

This story decides the one mechanism ActiveJob uses, and writes it at a single
reader:

- **Framework classes** (serializers, adapters, `Base`, the error classes) are
  seated on their namespace objects by their defining modules, so
  `constantize("ActiveJob::Serializers::SymbolSerializer")` walks
  `ActiveJob` → `Serializers` → `SymbolSerializer`.
- **Their Ruby name** (Ruby `Module#name`) is read through
  `registeredConstantName` (`inflector.ts:194`) extended to the namespace walk,
  or by registering each framework class under its full path. Pick one, apply
  it to every framework class, and give `self.class.name` sites one reader.
- **User and fixture job classes** are registered explicitly under their Ruby
  name, the `registerModel` precedent. `port-activejob-test-fixture-jobs` does
  it for the canonical fixtures, and `eager-load-app-jobs-in-finisher` does it
  for an application's `app/jobs`.

An unregistered class must fail the way Rails fails for an unloadable
constant: `ClassMethods#deserialize` raises the `NameError` from
`constantize`, unwrapped.

## Fidelity traps (predicted at authoring)

- [ ] `ActiveJob.adapter_name` `demodulize`s the full name (`queue_adapter.rb:11`); a last-segment-only name passes that call and fails `job_class`.
- [ ] `safe_constantize` returns `nil` only for a `NameError` about the requested constant; any other error propagates (`inflector.ts:237`).

## Acceptance criteria

- [ ] The chosen mechanism is written in the package README, naming the one reader every `self.class.name` site uses (ruby-compat's `rbModName`, which replaced `registeredConstantName`).
- [ ] `constantize("ActiveJob::Base")` resolves and `rbModName(Base)` is `"ActiveJob::Base"`. The serializers, adapters and error classes are not ported when this story runs (`port-activejob-arguments`, which ports `DeserializationError`, depends on it), so each is seated by the story that ports its file, following the README rule; `activejob-namespace-load-paths-and-eager-load-complete` checks the seats landed.
- [ ] A test round-trips a registered job class name through `constantize`, and an unregistered one raises `NameError`.

## Definition of done

Writing JS `constructor.name` into job data does not close this story; neither does a second, activejob-private constant registry.
