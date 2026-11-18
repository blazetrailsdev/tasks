---
title: "actionview-types-without-casts-remainder"
status: draft
updated: 2026-11-18
rfc: "0242-activerecord-actionpack-type-polish"
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

`actionview-types-without-casts` took `packages/actionview/lib` from 52 to 31
matches of `grep -Po ': an|as an|as unknown as'`. The `SanitizeHelperClass`,
`BehaviorClass` and `LayoutsClass` casts are gone. The 31 that remain each
need a type change, not a cast swap:

- `helpers/form-helper.ts:580`: `ActionView.Base.defaultFormBuilder` is not
  declared on `typeof Base`'s statics (`form_helper.rb` `default_form_builder`
  `cattr_accessor`).
- `helpers/form-helper.ts:712`, `helpers/tags/base.ts:111,121`: Rails reads
  `@template.instance_variable_get("@#{name}")` (`form_helper.rb:1729`,
  `tags/base.rb:66-75`). Porting them as `rbObjIvarDefined` / `rbObjIvarGet`
  camelCases the field name, so it needs checking against the assigns.
- `lookup-context.ts:118,121`: `WeakMap<WeakKey>` rejects a `symbol` under the
  current `lib`.
- `helpers/form-tag-helper.ts:652-659`, `helpers/tags/search-field.ts:12`,
  `context.ts:16`: host members (`mainApp`, `request`, `virtualPath`) that are
  read after an `rbObjRespondTo` check, and the host interfaces do not name them.
- `test-case.ts`: `viewContext()` as `LocalsView`, the controller's `_routes`
  typed as `RoutesHost`, and the `new.target` `includeHelperModulesBang` call.
- The renderer casts (`collection-renderer.ts`, `streaming-template-renderer.ts`,
  `template-renderer.ts`, `abstract-renderer.ts`), `path-registry.ts:65`,
  `routing-url-for.ts:101`, `rendering.ts:176`, `selector-assertions.ts:58`.

## Acceptance criteria

- [ ] actionview `lib/` count is 15 or fewer.
- [ ] No Rails method, parameter or local is renamed and no wrapper is added
      to avoid a cast.
