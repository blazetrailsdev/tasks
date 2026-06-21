---
title: "Module-namespaced model names in STI/polymorphic type + model_name"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 3771
claim: "2026-06-21T03:18:42Z"
assignee: "module-namespaced-sti-polymorphic-name"
blocked-by: null
---

## Context

Rails models in modules carry a `::`-qualified constant name that is stored
verbatim in STI `type` and polymorphic `*_type` columns, and feeds
`model_name`/i18n. trails has no way to express a model's module path, so every
namespaced model is hand-flattened (`MyApplication::Business::Firm` →
`MyAppBusinessFirm`) and the stored type values are wrong.

- `sti_name` (vendor/rails/activerecord/lib/active_record/inheritance.rb:187-189):
  `store_full_sti_class && store_full_class_name ? name : name.demodulize` —
  both default true, so STI `type` stores the **full** `self.name`
  (`"ClothingItem::Used"`).
- `polymorphic_name` (inheritance.rb:211-214): stores full `base_class.name`.
- `model_name` (vendor/rails/activemodel/lib/active_model/naming.rb:270-278) →
  `ActiveModel::Name.new(self, namespace)`; namespace nil for ordinary modules,
  so `name="Admin::User"`, `singular="admin_user"`, `element="user"`.

trails today:

- `inheritance.ts:179` `stiName` returns `modelClass.name` (bare JS name) — wrong.
- `inheritance.ts:188` `polymorphicName` returns `baseClass(...).name` — wrong.
- `activemodel/src/model.ts:1276` `modelName` getter calls
  `new ModelName(this.name)` with **no namespace** — wrong singular/i18n.
- `ModelName` (activemodel/src/naming.ts:120-209) is ALREADY namespace-aware
  (accepts `options.namespace`); it rejects `::` in the bare name (164-169), so
  pass segments, not a Ruby string.
- Current workaround: `registerModel("ClothingItem::Used", ClothingItemUsed)`
  (clothing-item.ts) patches only the READ path via
  `findStiClassInHierarchy` (inheritance.ts:833-839).

See audit:
~/.btwhooks/data/github/blazetrailsdev/trails/audits/module-namespaced-models-20260620T121611Z.md

## Acceptance criteria

- Add `static moduleName?: string` carrier on the model plus two helpers in
  `inheritance.ts`: `qualifiedName(klass)` returning
  `moduleName + "::" + klass.name` when `moduleName` is set else `klass.name`,
  and `namespaceSegments(klass)` returning `moduleName.split("::")` or `[]`.
- `stiName` returns `qualifiedName(klass)`; `polymorphicName` returns
  `qualifiedName(baseClass(klass))`.
- `modelName` getter threads `{ namespace: segments }` into `ModelName`.
- Convert `clothing-item.ts` and `admin/*` models to declare `moduleName`;
  remove the now-redundant read-path `registerModel("Ruby::Name", …)` calls and
  simplify the registry-fallback arm in `findStiClassInHierarchy`.
- Tests assert the persisted STI `type` value is the qualified string
  (`"ClothingItem::Used"`), polymorphic `*_type` is qualified, and
  `Admin::User.modelName` has `name`/`singular`/i18nKey matching Rails.
- Mirror Rails test names; no full-suite run. Stays under 500 LOC.
