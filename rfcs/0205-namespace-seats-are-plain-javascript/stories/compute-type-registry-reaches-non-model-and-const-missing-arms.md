---
title: "computeType registry reaches the non-model class_name and const_missing arms"
status: closed
updated: 2026-10-30
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: computeType keeps constantize under RFC 0213, so no registry arm exists to converge."
---

## Context

trails#9466 moved `computeType` (`packages/activerecord/src/inheritance.ts`) from `constantize` / `safeConstantize` onto the `registerModel` registry (`registeredModel`, `packages/activerecord/src/active-record.ts`). Rails' `compute_type` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:255-261`) goes through `constantize`, so it finds any constant and runs a model's `const_missing` on a miss. The model-only registry loses two arms:

- A `class_name` naming a non-model class must reach `compute_class`'s "not an ActiveRecord::Base subclass" `ArgumentError` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb`, `compute_class`). Today it raises `NameError`.
- A model's `const_missing` must run on a miss, so an incidental `NameError` from it surfaces unchanged.

Three Rails tests in `packages/activerecord/src/reflection.test.ts` are parked as `it.skip` for this (operator ruling on trails#9466, 2026-10-29): `reflection klass requires ar subclass`, `name error from incidental code is not converted to name error for association`, `automatic inverse does not suppress name error from incidental code`. Their `PERMANENT-SKIP:` lines cite a ruling that is not yet in any CLAUDE.md.

## Acceptance criteria

- [ ] Either converge: `computeType` reaches both arms without `constantize` (e.g. the lookup consults the model's `constMissing` on a registry miss, and a non-model class named by `class_name` is resolvable so `compute_class` raises Rails' `ArgumentError`), and the three tests are un-skipped with Rails' bodies; or the repo owner records the ruling in `packages/activerecord/CLAUDE.md` § "A model is seated by `registerModel`" with the three test names, and the skip lines cite that section only.
- [ ] No `constantize` / `safeConstantize` is reintroduced in `computeType`.
