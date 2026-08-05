---
title: "Carry rt_rewrite_frags and d_new_by_frags' civil fast path"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6112
claim: "2026-08-05T01:59:57Z"
assignee: "i18n-date-rewrite-frags-and-new-by-frags-fast-path"
blocked-by: null
closed-reason: null
---

## Context

`Date.parse` (`packages/i18n/src/date.ts`) runs `Date._parse` then
`completeFrags` then `rtValidDateFragsP`. Ruby runs one more step first.
`d_new_by_frags` (date-3.4.1 `ext/date/date_core.c:4283-4300`) is:

```c
    else {
    hash = rt_rewrite_frags(hash);
    hash = rt_complete_frags(klass, hash);
    jd = rt__valid_date_frags_p(hash, sg);
    }
```

`rt_rewrite_frags` (`date_core.c:3840-3872`) is not ported. It deletes a
`:seconds` frag and expands it into `:jd` + `:hour` + `:min` + `:sec` +
`:sec_fraction`, adding `:offset` first when one is present:

```c
    seconds = del_hash("seconds");
    if (!NIL_P(seconds)) {
    offset = ref_hash("offset");
    if (!NIL_P(offset))
        seconds = f_add(seconds, offset);
    d = f_idiv(seconds, INT2FIX(DAY_IN_SECONDS));
    ...
    set_hash("jd", f_add(UNIX_EPOCH_IN_CJD, d));
    set_hash("hour", h);
    ...
    }
```

`d_new_by_frags` also has a fast path ahead of that `else`: when `:jd` and
`:yday` are both absent and `:year`/`:mon`/`:mday` are all present it calls
`rt__valid_civil_p` directly, skipping both rewrite and complete. trails always
completes.

Not reachable through `Date.parse` today: `date__parse` never sets `:seconds`
(verified against ruby 3.3.11 — `Date._parse("@1000000000")` is
`{:year=>1000, :mon=>0, :mday=>0, :hour=>0}`, not a `:seconds`). The frag comes
from `Date._strptime`'s `%s`/`%Q`, which trails does not carry and no Rails
caller uses. So this is a dropped pipeline step rather than an observable bug —
the same class as the `c_valid_commercial_p` guards #6099 and #6104 converged.

**The date gem source is NOT vendored** (C stdlib). On this host it reads at
`~/.asdf/installs/ruby/3.3.11/lib/ruby/gems/3.3.0/gems/date-3.4.1/ext/date/date_core.c`;
`gem contents date` prints nothing because `date` is a default gem.

## Converged shape

`rtRewriteFrags` ported at `date_core.c:3840-3872`'s shape and called from
`Date.parse` ahead of `completeFrags`, and `d_new_by_frags`' civil fast path
carried so the pipeline reads as `d_new_by_frags` does.

## Acceptance criteria

- [ ] `rtRewriteFrags` expands a `:seconds` frag into `:jd`/`:hour`/`:min`/`:sec`/`:secFraction`, folding `:offset` in first.
- [ ] It runs ahead of `completeFrags` in `Date.parse`, and the civil fast path skips both as `d_new_by_frags` does.
- [ ] Regression coverage in `date.trails.test.ts` driving a `:seconds` frag directly, since no ported sub-parser emits one.
