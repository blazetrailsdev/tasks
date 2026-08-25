---
title: "I18n.eager_load! carries an extra load_path re-read the gem does not"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6092
claim: "2026-08-04T20:56:04Z"
assignee: "i18n-date-subx-cb-decomposition"
blocked-by: null
closed-reason: null
---

## Context

`I18n.eager_load!` (vendor/i18n/lib/i18n.rb:92-94) is exactly:

```ruby
def eager_load!
  config.backend.eager_load!
end
```

trails' `eagerLoadBang` (packages/i18n/src/i18n.ts) additionally calls
`await reloadTranslationFiles()` first, so an eager load re-reads
`I18n.load_path` without a caller-run preload (PR #6086). That extra call is a
deviation: it exists only because file reads are Promises here, and it also
makes `I18n.eager_load!` re-read bytes the gem would not re-read (the gem's
`Simple#eager_load!` reaches `init_translations`, which reads only when the
backend is uninitialized).

## Acceptance criteria

- [ ] `I18n.eagerLoadBang()` is `config().backend.eagerLoadBang()` and nothing
      else, matching i18n.rb:92-94.
- [ ] The read it currently performs is either pushed down to where the gem
      reads (inside the `init_translations` chain) or shown to be redundant with
      the boot preload / `Base#reloadBang` read, with a test covering an eager
      load that follows a mutated file.
- [ ] No new read on a path that already read (`Base#reloadBang` →
      `eager_load!` must stay one read per reload).
