# @klappay/mcp

## 1.1.0

### Minor Changes

- 1699c71: Bump `@klappay/node` to 5.2.0, `@klappay/types` to 6.1.0 and `@klappay/cli` to 1.4.2. `charges_check` now also returns `tokenSenders` and `userOperationSenders` alongside `transactionSender`: on-chain evidence of who paid when the payer didn't sign the transaction itself (an EIP-7702 wallet behind a gas-sponsoring relayer, or an ERC-4337 bundled user operation).

## 1.0.1

### Patch Changes

- d83a7f8: Bump `@klappay/node` to 5.1.5 and `@klappay/types` to 6.0.1.
