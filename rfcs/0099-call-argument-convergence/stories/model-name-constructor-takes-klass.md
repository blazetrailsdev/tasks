---
title: "ActiveModel::Name.new should take (klass, namespace) and demodulize internally"
status: done
updated: 2026-08-15
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6568
claim: "2026-08-15T15:45:07Z"
assignee: "insert-all-touch-timestamps-trailing-comma"
blocked-by: null
closed-reason: null
---

# `ActiveModel::Name.new` should take `(klass, namespace)` and demodulize internally

## Context

Surfaced converging RFC 0099's `kind: "args"` rows in PR #6557. Two rows —
`activemodel/model.ts` and `activemodel/serializers/json.ts`, both
`model_name -> new` with `rubyArgs: [this, namespace]` — carry a reviewed reason
rather than a fix.

`vendor/rails/activemodel/lib/active_model/naming.rb:270-277`:

    def model_name
      @_model_name ||= begin
        namespace = module_parents.detect do |n|
          n.respond_to?(:use_relative_model_naming?) && n.use_relative_model_naming?
        end
        ActiveModel::Name.new(self, namespace)
      end
    end

Rails passes the CLASS and lets `Name` derive the bare name and namespace from
the Ruby constant path. trails passes an already-demodulized name plus an
options bag — `new ModelName(bare, { klass, namespace })`
(`packages/activemodel/src/model.ts:1529,1540`) — because a JS class carries no
module path; trails reconstructs it from the `moduleName` carrier and
`_demodulizedName`.

The missing module path is a genuine language shortcoming, but the SPLIT is not:
the demodulizing currently happens at every call site instead of once inside
`Name`, which is why the same three-line block is duplicated in `model.ts` and
`serializers/json.ts`.

## Converged shape

`new ModelName(klass, namespace)` — Rails' two positional arguments — with the
`moduleName` / `_demodulizedName` reconstruction moved inside `ModelName`'s
constructor, where Rails does its own `name.demodulize` / `module_parents` work.

## Acceptance criteria

- [ ] `ModelName`'s constructor takes `(klass, namespace)`; the bare name and
      namespace segments are derived inside it.
- [ ] Both `model_name` call sites reduce to Rails' single `new` line.
- [ ] Namespaced STI / polymorphic `type` values are unchanged (existing tests).
- [ ] Both `model_name -> new` rows are deleted by hand from their shards
      (no `--write`, no reseed).
- [ ] `pnpm parity:api:calls:args` green; no new `pnpm parity:api:extra` surface.
