---
title: "Include ConditionalGet / EtagWithTemplateDigest / EtagWithFlash into Base as modules; fresh_when goes through combine_etags"
status: draft
updated: 2026-10-04
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while porting `action-controller-config-seats-onto-activesupport-primitives`.
That story declared `etaggers` and `etag_with_template_digest` with
`classAttribute.call(Base, …)` in `packages/actionpack/src/action-controller/base.ts`,
and made `etag` / `combineEtags`
(`packages/actionpack/src/action-controller/metal/conditional-get.ts`) read the
seat. The rest of the module is still not wired:

- Rails declares both seats inside each module's `included do` block
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/conditional_get.rb:14-16`,
  `metal/etag_with_template_digest.rb:30-36`). trails has no `ConditionalGet`,
  `EtagWithTemplateDigest` or `EtagWithFlash` module object: the files export loose
  functions, and `etag-with-flash.ts` / `etag-with-template-digest.ts` re-export
  `conditional-get.ts`'s functions as wrappers to stand in for `include`.
  Note that `include()` re-fires a module's `included` hook when the module is
  already in the ancestry, so two modules both including `ConditionalGet` would
  re-run `class_attribute :etaggers` and reset it; `ActiveSupport::Concern` does not.
- The two `included do etag { … } end` blocks (`etag_with_template_digest.rb:33-35`,
  `etag_with_flash.rb:17-19`) are not registered. trails has invented
  `templateEtagger` / `flashEtagger` functions that nothing calls.
- `Base#freshWhen` / `#isStale` (`base.ts`) are hand-written and never call
  `combine_etags` (`conditional_get.rb:137-152,336-338`); the baseline row is
  `scripts/api-compare/call-mismatches-exclude/actioncontroller/base.json`
  (`fresh_when` / `combine_etags`).
- `Metal.use`, `.action` and `.dispatch` (`metal.ts`) read `this.middleware()`
  where Rails reads `middleware_stack` (`metal.rb:293-295,315-336`), because the
  deferred `inherited` dup (`metal.rb:146-148`) lives in `middleware()`.

## Acceptance criteria

- `ConditionalGet`, `EtagWithTemplateDigest` and `EtagWithFlash` are modules
  included into `Base`, each declaring its seat and registering its etagger in its
  own `included` hook; the wrapper re-exports, `templateEtagger` and `flashEtagger`
  are gone.
- `fresh_when` takes Rails' body and goes through `combine_etags`; the baseline
  row is deleted.
- `Metal.use` / `.action` / `.dispatch` read `middlewareStack`, with the deferred
  `inherited` dup applied where the seat is read.
