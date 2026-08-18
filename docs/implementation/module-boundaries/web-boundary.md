# Web Boundary

- **Milestone unit:** PR 02K
- **Status:** Satisfied by existing M02 enforcement
- **Runtime behavior changed:** No
- **UI behavior changed:** No

## Boundary

The first-party web application communicates with ChannelForge through public
API contracts.

`web/src/**` must not import server module internals, persistence
implementations, database records, provider credentials, or server dependency
injection state.

## Public Contracts

The governed public-contract entry point established by M02 remains the
approved cross-package contract surface.

Provider payloads and inherited server implementation types are not promoted
into the web boundary.

## Generated Client Boundary

Milestone 02 defines the generated-client boundary but does not require a
client regeneration or API migration.

When generated client work is introduced, generated code must depend on public
transport contracts rather than server module internals.

## Enforcement

The M02 architecture scanner includes `web/src/**`.

Its fixture suite contains a forbidden web-to-server import case, and the
web-to-server critical rule cannot be waived.

The Architecture GitHub Actions workflow runs the scanner on both Linux and
Windows.

## Compatibility

Existing UI behavior remains unchanged during M02.

First-party API and UI migration remains assigned to Milestone 09.
