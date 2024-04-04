import { TransactionReceipt, zeroAddress } from "viem";
import { bigintToNumber } from "../number";

// See Amplitude dashboard for more details on the event properties:
type ParsedReceipt =
  | {
      transactionValid: boolean;
    }
  | {
      transactionFrom: string;
      transactionGasUsed: number;
      transactionHash: string;
      transactionStatus: number;
      transactionTo: string;
      transactionValid: boolean;
    };

export const parseReceipt = (receipt: TransactionReceipt | undefined): ParsedReceipt => {
  if (receipt === undefined) {
    return {
      transactionValid: false,
    };
  } else {
    return {
      transactionFrom: receipt.from,
      transactionGasUsed: bigintToNumber(receipt.gasUsed),
      transactionHash: receipt.transactionHash,
      transactionStatus: receipt.status === "success" ? 1 : 0,
      transactionTo: receipt.to || zeroAddress,
      transactionValid: true,
    };
  }
};
