# Contributing to REI Toolkit

Thanks for your interest in contributing! This project uses a dual-licensing model:

- Core (community) code is licensed under AGPL-3.0-only.
- Premium (commercial) code is licensed under BSL-1.1.

By submitting a contribution, you agree to the Contributor License Agreement (CLA) described below.

## Code of Conduct

Be respectful, inclusive, and constructive. We follow the principles of the Contributor Covenant.

## How to Contribute

1. Fork the repository and create a feature branch.
2. Add tests for new behavior and ensure all tests pass.
3. Follow existing coding styles and linting rules.
4. Submit a pull request with a clear description of the change and rationale.

## Contributor License Agreement (CLA)

To protect contributors and users, we require a CLA for all non-trivial contributions. The CLA confirms:

- You have the right to submit the contribution under the project’s dual licenses.
- You grant Cyberdime a perpetual, worldwide, non-exclusive, royalty-free license to use, reproduce, prepare derivative works of, and distribute your contribution under the project’s applicable licenses (AGPL-3.0-only for core areas, BSL-1.1 for commercial areas).
- You agree that contributions to BSL-1.1 areas may be redistributed under BSL-1.1 and, after the Change Date, under Apache-2.0 per BSL terms.

CLA Process:

- For now, include the statement below in your PR description. We may automate signature collection later.

```
I have read the CONTRIBUTING and I agree to license my contribution under the project’s dual licenses: AGPL-3.0-only for core areas and BSL-1.1 for commercial areas. I am authorized to submit this work and I sign this Contributor License Agreement.
```

## Project Areas and Licensing

See `licensing/feature-map.json` for open-core vs commercial boundaries. If your change spans both, split commits logically and clarify which parts are AGPL vs BSL.

## Development

- Node.js 18+, `npm install`, `npm run dev`
- Run tests with `npm test` and E2E with `npm run test:e2e`
- Use `npm run lint` before submitting

## Security

Report security issues privately to security@cyberdime.dev. Do not open public issues for vulnerabilities.

## Trademarks

"REI Toolkit" and related marks are trademarks of Cyberdime. See `TRADEMARKS.md`.
