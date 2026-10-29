---
title: "Trace or converge Action Cable receipts outside the socket-layer files"
status: done
updated: 2026-10-29
rfc: "0177-actioncable-package-port"
cluster: null
packages: ["actioncable"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9436
claim: "2026-10-29T14:57:22Z"
assignee: "actioncable-close-out"
blocked-by: null
closed-reason: null
---

## Context

RFC 0177's Verification line "Every receipt under `packages/actioncable/src` is
`PERMANENT`, sits in a file the CLAUDE.md section names (or at an adapter call a
story lists), and cites that section" does not hold, and cannot as written:

- Receipts carry no prose (`no-freeform-comments`; CLAUDE.md § "Fidelity is the
  job"), so no receipt can cite a section inline.
- 15 of the 19 receipts sit outside the four socket-layer files named in § "Node's
  event loop stands in for Action Cable's nio4r selector". Each one is for a different
  shortfall. For example, `server/broadcasting.ts#broadcast` and
  `channel/base.ts#transmit` carry `@missingRailsArgs truncate — PERMANENT`
  because JS strings have no `String#truncate` and activesupport ports it
  receiver-first (`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/broadcasting.rb:50-51`,
  `channel/base.rb:209`). Others: `channel/test-case.ts` / `connection/test-case.ts`
  `include`, `channel/streams.ts` `subscribe`, `channel/base.ts`
  `public_instance_methods` and `name`, `subscription-adapter/redis.ts`
  `redis_connector`, plus the `@noRailsEquivalent` sites in
  `server/configuration.ts`, `server/worker.ts`, `connection/base.ts`,
  `channel/base.ts` and `test-helper.ts`.

## Acceptance criteria

- [ ] Each of the 15 receipts is either converged (the call made with Rails'
      arguments) or traced to the ratified CLAUDE.md section or language limit
      that forces it, recorded in this story.
- [ ] The RFC's Verification line is amended to the rule that actually applies
      (PERMANENT, traced to a ratified section), via a markdown PR.

## Resolution (trails#9436)

Converged:

- `server/worker.ts` `splitArgs` (`@noRailsEquivalent`): deleted. `asyncExec`,
  `asyncInvoke` and `invoke` now parse Rails' `(*args, connection:, &block)`
  header (`server/worker.rb:47-61`) in place, with ruby-compat's `rbScanArgs`
  (MRI `rb_scan_args_set`), the settled kwargs idiom.

Traced, each `PERMANENT`:

- `@missingRailsArgs truncate`, `server/broadcasting.ts` and `channel/base.ts`
  (`server/broadcasting.rb:50-51`, `channel/base.rb:209`): `String#truncate` is a
  core extension, and a JS string primitive can't carry it (§ "Ruby Strings are JS
  string primitives"), so activesupport ports it receiver-first.
- `@missingRailsArgs public_instance_methods`, `channel/base.ts`
  (`channel/base.rb:131-135`): a JS class has no such method, and
  `publicInstanceMethods` reads `defineModule`'s section record (§ "Method
  visibility is compile-time only", last bullet).
- `@missingRailsArgs include`, `channel/test-case.ts` and `connection/test-case.ts`
  (`connection/test_case.rb:196`, `singleton_class.include`): written
  `include(rbObjSingletonClass(x), M)` (§ "Module mixins", § "`singleton_class`
  is a per-object subclass").
- `@missingRailsArgs subscribe`, `channel/streams.ts` (`channel/streams.rb:101-104`):
  Ruby's `lambda do … end` argument is a JS arrow function.
- `@missingRailsArgs redis_connector`, `subscription-adapter/redis.ts`
  (`subscription_adapter/redis.rb:59-61`): `redis_connector.call(config)` is a
  Proc's `call`; JS invokes the function directly, and `Function#call` would
  take the config as `this`.
- `@missingRailsName name` ×2, `channel/base.ts` (`self.class.name`): JS
  `Function.name` is the JS identifier, so the Ruby name is `rbObjClassname`
  (§ "Class-path tables answer class → Ruby name").
- `@noRailsEquivalent` `registerChannel` / `registerConnection`: named by
  § "Constant lookup is an import or a registry".
- `@noRailsEquivalent` `[classModule]`, `test-helper.ts`: § "A Ruby module is a
  JS object or a JS class".
- `@noRailsEquivalent` `loadPubsubAdapter`, `server/configuration.ts`
  (`server/configuration.rb:40-67`'s `require`): an ESM `import()` is awaited, the
  shape of § "An adapter file is loaded by an awaited step". That section lists
  only two such `require`s, and this is a third; a CLAUDE.md edit naming it is
  owner-ratified text, so it is left to the owner.
