---
title: "Namespaced model generation emits a ::-joined class and no module file"
status: in-progress
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: trails#8221
claim: "2026-09-28T16:27:29Z"
assignee: "scaffold-controller-passes-locals-instead-of-setting-ivars"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `namespaced-model-generation-builds-illegal-migration-name` (trails#8201).
The legacy `ModelGenerator` (`packages/trailties/src/generators/model-generator.ts`), which
`ScaffoldGenerator` calls, builds `className = camelize(singularName)`. For `admin/account` that
is `Admin::Account`, so the model file emits `export class Admin::Account extends ApplicationRecord`,
which is not valid TypeScript. Since #8201 the namespaced migration is correct (`create_admin_accounts`),
but the model file still is not.

Rails: `activerecord/lib/rails/generators/active_record/model/model_generator.rb:31-39`.
`create_model_file` writes `app/models/admin/account.rb` from `model.rb.tt`, and `create_module_file`
writes `app/models/admin.rb` (`module.rb.tt`) when `regular_class_path` is non-empty and
`behavior == :invoke`.

## Converged shape

- The model file declares a valid class for a namespaced name. This follows the trails namespace idiom
  used for namespaced controllers (`parentRefForRelative`, `controller-paths.ts`), not a `::`-joined identifier.
- `create_module_file` is ported: on invoke only, `app/models/admin.ts` is emitted for a non-empty class path.

## Acceptance criteria

- `model_generator_test.rb`'s `model with namespace` ports and passes.
- `scaffold admin/account` output typechecks.
