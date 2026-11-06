---
title: "I18n KeyValue's SubtreeProxy answers `[]` without a returned Proxy"
status: claimed
updated: 2026-11-06
rfc: "0221-no-returned-proxies"
cluster: constructor-returned
packages: ["i18n"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-06T16:42:09Z"
assignee: "app-generator-action-methods-method-missing-in-prototype-chain"
blocked-by: null
---

## Context

trails:

- `packages/i18n/src/backend/key-value.ts:202`

Rails / Ruby:

- `vendor/i18n/v1.14.8/lib/i18n/backend/key_value.rb:161-199`

Latent instance of the defect itself: `SubtreeProxy` declares `#masterKey` / `#store` / `#subtree` and returns a Proxy, so any subclass field fails under an AOT runtime. Ruby's `SubtreeProxy` has no `method_missing`; it defines `[]`, `has_key?`, `is_a?`, `instance_of?`. Port `[]` as the member it is where the call sites allow, and convert the call sites that read a key as a dotted name to `[]`.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] No `new Proxy(` value is returned to a caller from the site(s) above:
      the constructor returns nothing.
- [ ] The class answers the members the Ruby counterpart defines (named in
      Context) as ported members under their Rails names, and nothing else.
      No `method_missing`-style trap is added, in the prototype chain or
      elsewhere, because Ruby has none here.
- [ ] Every trails caller that read a name through the old trap is converted
      to one of those members, or to a member of the object the Ruby caller
      reaches; the PR lists the converted call sites.
- [ ] A test declares a subclass with a `#private` field, constructs it, and
      reads the field, and the ported members are tested.
