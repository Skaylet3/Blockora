# Implementation Review Checklist: UI Behavioral Test Coverage

**Purpose**: Post-implementation requirements quality review — test spec completeness, coverage gaps, and CI/CD readiness
**Created**: 2026-02-25
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [tasks.md](../tasks.md)
**Audience**: Author self-review + PR reviewer
**Focus areas**: Test specification quality · Coverage gap analysis · CI/CD readiness

---

## Specification Completeness

- [ ] CHK001 Does FR-011's "standard project installation" definition explicitly include the `playwright install chromium` step, or is that an undocumented prerequisite that violates the zero-config promise of SC-006? [Completeness, Spec §FR-011, §SC-006]
- [ ] CHK002 Are isolation requirements in FR-010 specified separately for Playwright (browser context reset) and Vitest (fresh component render), or only as a single generic rule? [Completeness, Spec §FR-010]
- [ ] CHK003 Does the spec define how test data (the mock block dataset) is to be reset between E2E test runs, given that blocks created in one test could persist into the next in the same server session? [Completeness, Gap]
- [ ] CHK004 Are the four edge cases listed in the spec (rapid submit, zero-match search, expired session redirect, all-archived active tab) formally required acceptance scenarios, or only open questions — and is the distinction explicitly stated? [Completeness, Spec §Edge Cases]
- [ ] CHK005 Does the spec define requirements for what constitutes a "passing" test result (exit code, no console errors, no flaky assertion retries), or is this left implicit? [Completeness, Gap]
- [ ] CHK006 Is there a requirement defining which test framework (Playwright vs Vitest/RTL) covers which user stories — or is this an undocumented implementation decision that could silently change? [Completeness, Gap, Traceability]
- [ ] CHK007 Are requirements defined for the `test:watch` script — when and by whom it should be used — or is its purpose undocumented in the spec? [Completeness, Gap]

---

## Requirement Clarity & Measurability

- [ ] CHK008 Is SC-004's "under 3 minutes" threshold defined relative to a specific hardware class or reference machine, or is it a universally-expected outcome regardless of environment? [Clarity, Spec §SC-004]
- [ ] CHK009 Is "zero flaky tests" in SC-005 operationalized with a specific detection method (e.g., minimum consecutive passing runs required), or is it only an outcome goal with no measurable acceptance criteria? [Measurability, Spec §SC-005]
- [ ] CHK010 Is SC-006's "no additional configuration" guarantee defined to include or exclude OS-level system dependencies required by Playwright in headless Linux/WSL environments? [Clarity, Spec §SC-006]
- [ ] CHK011 Is "blocks at the top of the active blocks grid" in US2 Scenario 1 a positional requirement (must be first item) or a presence requirement (must exist somewhere in the list)? [Clarity, Spec §US2, Scenario 1]
- [ ] CHK012 Is the "success notification" in US5 Scenario 2 defined by content text, duration, or positioning — or only by existence? [Clarity, Spec §US5, Scenario 2]
- [ ] CHK013 Does FR-005 ("verifying results update to match the entered query") specify whether title match, content match, or both are required to be tested as independent assertions? [Clarity, Spec §FR-005, §US3 Scenario 1]
- [ ] CHK014 Is SC-003 ("a deliberate regression is detected within a single test run") measurable without specifying which flows/components qualify as "covered" for regression detection purposes? [Measurability, Spec §SC-003]

---

## Scenario & Coverage Quality

- [ ] CHK015 Is there a requirement covering the combined filter scenario — type filter AND search query applied simultaneously — which is a common user pattern not currently specified as an acceptance scenario? [Coverage, Gap, Spec §US3]
- [ ] CHK016 Does the spec treat the tag filter as a distinct testable acceptance scenario, or is it implicitly bundled with the type filter in FR-006 without independent verification criteria? [Coverage, Spec §FR-006, §US3 Scenario 2]
- [ ] CHK017 Is the block content search path (searching text within `block.content`, not just `block.title`) specified as a distinct required test scenario, or only implied by the general search requirement? [Coverage, Spec §FR-005]
- [ ] CHK018 Are requirements defined for the profile page cancel behavior under the condition where NO changes were made — is cancelling an unmodified form in scope or out of scope? [Coverage, Spec §US5 Scenario 3]
- [ ] CHK019 Does the spec define whether the "all blocks archived → empty active tab" edge case requires testing both the empty state rendering AND the absence of layout errors, or only one of these? [Coverage, Spec §Edge Cases]
- [ ] CHK020 Is the rapid duplicate submission edge case addressed with a defined expected outcome (e.g., "only one block created", "second submit is no-op") or left as an unresolved open question? [Clarity, Spec §Edge Cases]
- [ ] CHK021 Are requirements specified for the block detail sheet as a distinct test target — or is it only tested implicitly through the block lifecycle flow? [Coverage, Spec §Assumptions, Gap]
- [ ] CHK022 Does SC-002 ("100% of acceptance scenarios have a corresponding automated check") account for the 4 edge cases — are they expected to become acceptance scenarios or are they explicitly excluded from the 100% count? [Clarity, Spec §SC-002, §Edge Cases]

---

## CI/CD & Pipeline Requirements

- [ ] CHK023 Are CI pipeline integration requirements defined for this test suite — including which CI system (e.g., GitHub Actions), trigger events (push, PR), and branch policies? [Gap]
- [ ] CHK024 Is there a requirement defining whether E2E tests in CI should run against the production build (`next build && next start`) or the dev server (`next dev`), given that the two environments can diverge in behavior? [Gap]
- [ ] CHK025 Are requirements defined for how test failures should surface in CI — exit code behavior, PR status checks blocking merge, artifact upload (e.g., Playwright HTML reports, screenshots)? [Gap]
- [ ] CHK026 Are Playwright system-dependency installation requirements for headless CI Linux environments documented (e.g., `playwright install --with-deps` vs `playwright install`)? [Gap, Spec §SC-006]
- [ ] CHK027 Is there a requirement specifying whether the `test` and `test:e2e` turbo pipeline tasks should block the build pipeline (i.e., must pass before `build` proceeds) or run as independent jobs? [Gap]
- [ ] CHK028 Are caching requirements for the Playwright browser binary and Vitest transform cache defined to prevent re-downloading on each CI run? [Gap]
- [ ] CHK029 Is there a requirement defining the minimum Playwright worker count in CI to balance speed (SC-004) against resource constraints of the CI runner? [Gap]

---

## Test Maintainability Requirements

- [ ] CHK030 Are selector stability requirements defined — e.g., "tests must use role/label/text selectors and must not reference CSS class names" — to prevent test brittleness after UI refactoring? [Gap]
- [ ] CHK031 Does the spec define requirements for adding tests when new user stories are introduced — i.e., is there a stated policy that new behavior must have corresponding tests before merge? [Gap, Consistency with Constitution §V]
- [ ] CHK032 Is the shared fixture and helper strategy (`createBlock`, `seedSession`) documented as a required convention for future test authors, or only as an internal implementation decision? [Gap, Traceability]
- [ ] CHK033 Are requirements defined for test naming conventions, file organization, and co-location rules that future contributors must follow? [Gap]
- [ ] CHK034 Is there a requirement defining how tests must be updated when covered UI components are refactored (e.g., "tests must be updated in the same PR as the UI change")? [Gap]

---

## Dependencies & Assumptions Quality

- [ ] CHK035 Is the assumption that "the application uses mock/in-memory data" formally validated for the profile page — where `initialName` and `initialEmail` are hardcoded in the Server Component rather than derived from a shared mock data module? [Assumption, Spec §Assumptions]
- [ ] CHK036 Is the assumption "session state is simulated via cookies" verified to be sufficient for all E2E scenarios, including tests that check server-side redirect behavior (which reads the cookie in a Server Component)? [Assumption, Spec §Assumptions]
- [ ] CHK037 Are dependency version constraints for the test tooling (Playwright, Vitest, RTL) specified as requirements, or only expressed as semver ranges in `package.json` that could silently upgrade to breaking versions? [Dependency, Gap]
- [ ] CHK038 Is the dependency on port 3000 being available for Playwright's dev server documented as an assumption, including the requirement to handle port-in-use conflicts in the local development workflow? [Dependency, Gap, Spec §FR-011]

---

## Notes

- Items marked `[Gap]` identify requirements not present in the spec that may need to be added before this feature is considered fully specified
- Items marked `[Ambiguity]` or `[Clarity]` identify requirements present but not precise enough to be unambiguously verifiable
- CI/CD items (CHK023–CHK029) are entirely absent from the current spec and plan — these represent the largest gap category
- SC-005 (zero flaky tests) and FR-011 (clean environment) are the two requirements with the most measurement uncertainty
