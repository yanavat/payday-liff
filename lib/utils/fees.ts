export const DEFAULT_TRANSFER_FEE_THB = 15;

export function getNetTransferAmount(amount: number, transferFee = DEFAULT_TRANSFER_FEE_THB) {
  return Math.max(amount - transferFee, 0);
}
