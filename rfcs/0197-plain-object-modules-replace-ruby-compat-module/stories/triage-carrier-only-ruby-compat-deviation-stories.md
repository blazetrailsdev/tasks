---
title: "Triage the RFC 0154 drafts that exist only because of the Module carrier"
status: ready
updated: 2026-10-25
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: ledger
packages: ["ruby-compat"]
deps: ["delete-ruby-compat-module-class-final"]
deps-rfc: []
est-loc: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Fifteen open RFC 0154 drafts name ruby-compat's `Module` carrier, `new Module`
or `superMethod` in their bodies. Found by grepping
`rfcs/0154-ruby-compat-surfaced-deviations/stories/` for
`carrier|new Module|superMethod|carrierOf` and keeping rows whose DB status is
not done or closed (2026-10-22):

- `concern-class-methods-builds-a-module`
- `free-function-include-on-a-module-target-drops-nested-modules`
- `prepend-copies-onto-the-class-so-super-method-cannot-resume-from-it`
- `module-method-missing-proxy-is-spliced-from-an-included-block`
- `rb-obj-dup-open-codes-kernel-initialize-dup`
- `ruby-compat-rb-define-module-reopens-a-namespace`
- `rb-obj-is-kind-of-misses-module-extend-object`
- `class-copy-does-not-carry-prepend-origin-or-registries`
- `psych-to-ruby-revives-a-mapping-as-a-record-where-marshal-answers-a-map`
- `module-include-drops-class-module-accessors`
- `marshal-class2path-renders-anonymous-module-as-class`
- `rb-mod-ancestors-lists-prepended-module-after-the-class`
- `concern-append-features-into-a-plain-module`
- `module-super-method-resolves-on-every-call`
- `marshal-userdef-and-time-dump`

RFC 0197's `delete-ruby-compat-module-class-final` deletes the carrier.
After it lands, each of these is either moot or a defect against the
plain-object / class-module shape (CLAUDE.md § "A Ruby module is a plain object
or a class module"). Some, such as the Marshal and Psych ones, only mention
the carrier in passing.

## Acceptance criteria

- [ ] Each of the fifteen gets a verdict: moot (close with `FALSIFIED:` and
      the deleting PR), restated against the shape that replaced the carrier
      (a markdown PR rewriting its Context and criteria, with the trails
      `file:line` of the new shape), or unaffected (a one-line note in the PR
      body).
- [ ] No story is closed by moving it to another register.
- [ ] Markdown-only PRs and `tasks close`; no DB-owned field hand-edited.
