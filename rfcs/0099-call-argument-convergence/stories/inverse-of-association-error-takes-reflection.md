---
title: "InverseOfAssociationNotFoundError should take the reflection, as Rails does"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6563
claim: "2026-08-15T13:15:05Z"
assignee: "wave-1b-relation-own-file-rows-remainder"
blocked-by: null
closed-reason: null
---

# `InverseOfAssociationNotFoundError` should take the reflection, as Rails does

## Context

Surfaced converging RFC 0099's `kind: "args"` rows in PR #6557. The row

    activerecord | reflection.ts | check_validity_of_inverse! | new
    rubyArgs: [this]

carries a reviewed reason rather than a fix.

`vendor/rails/activerecord/lib/active_record/reflection.rb:264-273`:

    def check_validity_of_inverse!
      if !polymorphic? && has_inverse?
        if inverse_of.nil?
          raise InverseOfAssociationNotFoundError.new(self)
        end
        if inverse_of == self
          raise InverseOfAssociationRecursiveError.new(self)
        end
      end
    end

Rails hands the error the reflection and lets the error derive both the message
and the `Did you mean?` corrections (from `associated_class.reflections.keys`).
trails instead derives them at the raise site and passes four already-computed
arguments — `(name, inverseOf, corrections, className)` — with a try/catch
around `this.klass` because it is not always resolvable
(`packages/activerecord/src/reflection.ts:420-446`).

## Converged shape

`new InverseOfAssociationNotFoundError(reflection)`, with the message and
corrections computed inside the error, as Rails does. The unresolvable-`klass`
fallback moves inside the error too, where Rails' own `associated_class`
fallback to `reflection.class_name` already lives.

## Acceptance criteria

- [ ] The error takes the reflection; the raise site is Rails' one-liner.
- [ ] The `Did you mean?` corrections and the `in <class>` clause are unchanged
      in the rendered message (covered by existing tests).
- [ ] The `check_validity_of_inverse! -> new` row is deleted by hand from its
      shard (no `--write`, no reseed).
- [ ] `pnpm parity:api:calls:args` green; all three adapter lanes green.
