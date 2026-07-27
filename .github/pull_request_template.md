## Roadmap and Architecture

- **Milestone:**
- **Work item:**
- **Risk level:** Low / Moderate / High / Critical
- **Governing specifications:**
- **Governing ADRs:**
- **Issue or finding IDs:**

## Summary

Describe the change and why it belongs in this pull request.

## Current Behavior

Describe the inherited or current behavior being preserved, measured, adapted,
or replaced.

## Target Behavior

Describe the intended behavior after merge.

## Authority

- **Current data/write authority:**
- **Target data/write authority:**
- **Compatibility boundary:**
- **Canonical after this PR:** Yes / No

## Impact Matrix

| Area | Impact | Evidence or explanation |
| --- | --- | --- |
| Persistence | None / Read / Write / Migration | |
| API | None / Compatible / Additive / Breaking | |
| UI | None / Internal / User-visible | |
| Providers | None / Plex / Jellyfin / Emby / Local | |
| Scheduling | None / Characterized / Changed | |
| Playout/output | None / Characterized / Changed | |
| Security/privacy | None / Reviewed / Changed | |
| Deployment | None / Docker / Compose / Unraid / Platform | |

## Risk

- **Risk triggers:**
- **Failure impact:**
- **Required gates:**
- **Why this is not a higher risk:**

## Migration and Compatibility

- **Migration required:** Yes / No
- **Legacy reads:**
- **Legacy writes:**
- **Restart behavior:**
- **Backup precondition:**
- **Removal or cleanup condition:**

## Rollback or Safe Failure

Describe how the prior authority is restored or how the system fails without
data loss. “Revert the commit” is insufficient after durable state, identity,
or secrets have changed.

## Validation

List commands and results.

```text
git diff --check
pnpm build
```

Add focused unit, integration, contract, migration, runtime, platform,
performance, security, or soak evidence required by the risk classification.

## Generated Files and Fixtures

- **Generated files:** None / List
- **Generator or reproduction command:**
- **Source commit or input:**
- **Sanitization:**
- **Stable ordering:**
- **Golden-file review intent:** Preserve / Replace / Not applicable

## Security and Secrets

- [ ] No credentials, tokens, private URLs, private paths, user databases, or
      private media are committed.
- [ ] Logs, errors, XMLTV, M3U, FFmpeg diagnostics, support output, snapshots,
      and generated evidence are secret-safe.
- [ ] Provider calls do not occur inside SQLite write transactions.
- [ ] New plugin-facing behavior uses explicit capabilities.

## Scope Control

- [ ] The pull request changes one coherent boundary or capability.
- [ ] No unrelated dependency upgrade, broad rename, formatting rewrite, or
      cleanup is included.
- [ ] Runtime implementation and broad rebranding are separated.
- [ ] Generated output is paired with its generator or reproduction evidence.
- [ ] Deferred cleanup is listed below.

## Deferred Work

List explicit follow-up work, owner, target milestone, and reason.

## Reviewer Checklist

- [ ] Architecture references match the implementation.
- [ ] Current and target authorities are explicit.
- [ ] Risk classification is sufficient.
- [ ] Compatibility and migration behavior are testable.
- [ ] Rollback or safe failure is credible.
- [ ] Required validation passed.
- [ ] No secrets or private data are exposed.
- [ ] Main remains buildable.
