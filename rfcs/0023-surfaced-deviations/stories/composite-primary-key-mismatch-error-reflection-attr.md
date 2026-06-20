---
title: "CompositePrimaryKeyMismatchError: store reflection object (attr_reader :reflection parity)"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 3690
claim: "2026-06-20T01:21:43Z"
assignee: "composite-primary-key-mismatch-error-reflection-attr"
blocked-by: null
---

## Context

Rails' `CompositePrimaryKeyMismatchError` (`activerecord/lib/active_record/associations/errors.rb:182`) stores the reflection object via `attr_reader :reflection` and derives the message from it inside the constructor:

```ruby
class CompositePrimaryKeyMismatchError < ActiveRecordError
  attr_reader :reflection
  def initialize(reflection = nil)
    @reflection = reflection
    if reflection
      ...super with reflection.active_record, reflection.name, reflection.active_record_primary_key / reflection.association_primary_key, reflection.foreign_key...
    end
  end
end
```

Trails' constructor (`packages/activerecord/src/associations/errors.ts`) takes flat `(owner, association, primaryKey, foreignKey)` strings and has no `reflection` property. The message parity story (#3681) converged the message text but left the constructor signature diverged.

The `reflection` reader is not called externally in Rails' test suite, so this is a minor divergence, but callers that rescue and inspect `error.reflection` would get `undefined` in Trails.

## Acceptance criteria

- [x] `CompositePrimaryKeyMismatchError` declares a readable `reflection` property matching `attr_reader :reflection`. **Correction (PR #3690):** the premise that Rails _stores_ the reflection was wrong — vendored Rails 8.0.2 declares `attr_reader :reflection` but `initialize` never assigns `@reflection` (`errors.rb:190-200`), so `error.reflection` is always nil. Faithfully mirrored: the reader exists for API parity but stays `null`.
- [x] Constructor signature moves toward the Rails form: accepts a reflection object (or `null`/`undefined`) and derives the message from it (branching on macro per `errors.rb:192-196`), rather than accepting flat strings.
- [x] All existing call sites in `reflection.ts`, `associations.ts`, `autosave-association.ts`, `association-scope.ts`, and `collection-proxy.ts` updated to pass the reflection object. (`reflection.ts` passes the real reflection; trails-only guard sites pass a reflection-shaped object — tracked for convergence in `composite-pk-mismatch-extra-guard-raise-sites`.)
- [x] Existing message assertions in the malformed-association tests still pass.
