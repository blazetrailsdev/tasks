---
title: "Derive kebab-case view prefixes, so apps need no snake_case exception in app/views"
status: draft
updated: 2026-09-09
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview", "actionpack", "trailties"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**This story was filed on a wrong premise, corrected here.** It said trails'
generators emit snake_case view directories and that a kebab-case application
therefore needs a carve-out. The generator emits **kebab-case**:
`controller-paths.ts` derives its `viewBase` with `dasherize(underscore(...))`.
What was actually true is worse and simpler — the generator and the lookup
disagree, and have since the generator was written:

```text
class             : RfcPagesController
generator writes  : app/views/rfc-pages/   (controller-paths.ts)
localPrefixes     : app/views/rfc_pages/   (view-paths.ts)
agree?            : false
```

`trails g controller RfcPages` scaffolds an application that raises a missing
template for the views it just created. It survived because every generator
test uses a single-word name — `account`, `admin/account` — and for those
`dasherize` is a no-op, so the two directories coincide.

So this is not a convention to push into the framework. It is a defect, and
fixing it happens to land on kebab-case, which is the spelling the generator
already chose.

## Landed: blazetrailsdev/trails#7651

`localPrefixes` now looks under the kebab-cased directory first, keeping the
underscored one as a fallback so applications already holding
`app/views/rfc_pages/` keep rendering.

**The spelling is applied in `localPrefixes`, NOT in `controllerPath`**, and
that is the load-bearing decision. `controllerPath` has six consumers and only
the view lookup was wrong: it also keys i18n lookups
(`AbstractController::Translation`) and the rate limiter's cache entries.
Dasherizing it would rename translation keys and reset live rate-limit counters
— no part of this. `controllerPath` keeps returning Rails' value, so the API
surface is unchanged and `parity:api` is unaffected; the divergence is that
`local_prefixes` returns two entries where Rails' returns one.

## What is left: remove the fallback

The fallback is what makes #7651 safe to land, and it is also the thing that
leaves the convention undecided — two spellings both work. Removing it is the
remaining work and the deliberate breaking change:

- delete the underscored entry from `localPrefixes`
- convert `app/views/passwords_mailer/` in the authentication generator, the
  one underscored view path trails ships (mailer views — confirm that axis
  should move too, rather than assuming it)
- say so in the guides and in `trails new`'s generated `CLAUDE.md`

It is cheap: `packages/` contains **zero** underscored view directories today,
so nothing inside trails breaks. The cost is entirely to applications that
already hold them, which is why the fallback ships first and its removal is
timed rather than bundled.

## Follow-on

blazetrailsdev/trailmap#21 carries the `controllerPath` override and records
the rule in its `CLAUDE.md`; `test/views/view-directory-names.test.ts` asserts
both that the override still produces kebab-case and that every directory on
disk is one a controller asks for. If this story lands with option 1 or 3,
trailmap deletes the override and that suite is what notices if the cleanup is
done by halves.

## Acceptance criteria

- The generator and the lookup agree for a MULTI-WORD controller name, proven
  by a generator test — the case whose absence hid the defect. (Done, #7651.)
- The spelling is decided in one place, and `controllerPath` is not it, so i18n
  keys and rate-limit cache keys are untouched. (Done, #7651.)
- The underscored fallback is removed, leaving kebab-case as the only spelling,
  and the missing-template message names the directory that is now expected.
- `app/views/passwords_mailer/` is converted or explicitly exempted, with the
  reason written down.
- `pnpm parity:api` delta for actionpack/actionview is recorded, with the
  `local_prefixes` divergence named.
