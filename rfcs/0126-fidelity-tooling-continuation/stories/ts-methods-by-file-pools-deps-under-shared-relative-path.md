---
title: "tsMethodsByFile pools dep packages under a relative path two gems share"
status: draft
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# tsMethodsByFile pools dep packages under a relative path two gems share

## Context

Found while fixing `call-set-pairing-prefers-owning-gem` in PR #7154.

`scripts/api-compare/compare.ts` keys its TS side-maps on a path RELATIVE to the
package src dir, and that path is not unique across packages: activemodel and
activerecord both port `attribute_methods.rb` to `attribute-methods.ts`, and the
same holds for `attribute_assignment.rb`, `validations.rb`, `callbacks.rb` and
every other file both gems carry.

PR #7154 closed the hole for the BODY maps (`tsCallsByFileName`,
`tsCallArgsByFileName`, `tsCallSeqByFileName`, `tsSkeletonByFileName`), which
are now written under `scope === "package"` only — ActiveModel's
`generate_alias_attribute_methods` body had been answering for ActiveRecord's,
covering all four calls the AR port omits
(`activerecord/lib/active_record/attribute_methods.rb:80-85`) while the gate
stayed green.

`tsMethodsByFile` is the same shape and was deliberately left alone: the dep
walk adds dep-parent method NAMES to it so an inherited method can match. But
the walk keys on `m.file`, so an activemodel member also lands under
activerecord's identically-named key — and `tsMethodsByFile` is what
`directMatch` consults. A Ruby method activerecord does NOT port can therefore
read as matched because activemodel ports a same-named method in a same-named
file. Unmeasured either way; #7154 did not touch it because it moves the
matched/missing headline number, which needs its own before/after.

## Converged shape

Key the dep-pooled names by (package, file) — or restrict the file-keyed half to
the package's own members and let the inheritance walk carry the cross-package
names it actually needs, which is what its docblock already claims it does
("adds dep-parent method NAMES … Matching is unchanged; only the pool grows").

## Acceptance criteria

- [ ] A dep package's member no longer satisfies a `directMatch` for a Ruby
      method under a path the two packages happen to share.
- [ ] The matched/missing delta is reported in the PR body per package; a DROP
      is the expected shape (phantom matches retiring), and each dropped pair is
      spot-checked against `vendor/rails` to confirm trails really does not port
      it there.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas accounted for, and any
      inheritance pairing that genuinely depended on the pooled name keeps
      working (that is the arm the dep walk exists for).
