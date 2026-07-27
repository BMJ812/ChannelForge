# Milestone 01 Platform Matrix

- **Status:** Reviewed
- **Authoritative release platform:** Linux
- **Supported development platform:** Windows
- **Runtime behavior changed:** No

## Matrix

| Capability | Windows 11 AMD64 | GitHub-hosted Linux X64 | Authority and disposition |
| --- | --- | --- | --- |
| Node.js | `v22.20.0` | `v22.20.0` | Matched |
| pnpm | `10.28.0` | `10.28.0` | Matched |
| Baseline collector tests | 10 passed | 10 passed | Cross-platform green |
| Characterization foundation | 5 passed | 5 passed | Cross-platform green |
| Build | 5 Turbo tasks passed | 5 Turbo tasks passed | Cross-platform green |
| Shared tests | 192 passed | 192 passed | Cross-platform green |
| Web tests | 76 passed | 76 passed | Cross-platform green |
| Server tests | 1,074 passed, 43 failed, 2 skipped | 1,117 passed, 2 skipped | Linux authoritative; Windows failures classified |
| Path semantics | 3 path-form assertion failures | Passed | `BASE-001`; Windows platform difference |
| SQLite temporary cleanup | 40 `EBUSY` failures | Passed | `BASE-002`; Windows platform difference |
| Repository cleanliness | Clean after collection | Clean before and after workflow | Green |
| Docker daemon | Unavailable | Not required for test baseline | Runtime deployment validation deferred to M10 |
| WSL | Only `docker-desktop` registered | Not applicable | Not used as Linux authority |
| GitHub Actions | Available | Native execution environment | Authoritative Linux mechanism |

## Platform Policy

1. Linux is the release-authoritative baseline because ChannelForge's planned
   production deployment is Docker- and Unraid-oriented.
2. Windows remains a supported development platform.
3. A Windows-only failure is not ignored; it must be classified and retained in
   the issue register.
4. A Linux success does not authorize changing Windows behavior without a
   focused compatibility decision.
5. A Windows cleanup or path correction must not alter persistence, provider,
   scheduling, playout, or output semantics.
6. Milestone 02 may introduce module boundaries around inherited behavior, but
   it may not use platform differences as justification for unrelated runtime
   replacement.

## Entry into Milestone 02

The matrix supports Milestone 02 entry after PR #13 is merged:

- Both platforms build.
- Baseline and characterization-foundation tests pass on both platforms.
- The authoritative Linux full suite passes.
- Every Windows failure is classified.
- The remaining Windows findings are nonblocking and owned.
