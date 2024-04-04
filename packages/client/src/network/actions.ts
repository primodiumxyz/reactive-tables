import { Entity } from "@latticexyz/recs";
import {
  SystemCall,
  SystemCallFrom,
  encodeSystemCallFrom,
  encodeSystemCalls,
  encodeSystemCallsFrom,
} from "@latticexyz/world";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";
import { toast } from "react-toastify";
import { CallExecutionError, ContractFunctionExecutionError, Hex, TransactionReceipt } from "viem";
import { PublicClient } from "viem/_types/clients/createPublicClient";
import { components } from "./components";
import { MetadataTypes } from "./components/customComponents/TransactionQueueComponent";
import { MUD } from "./types";

export async function _execute({ network: { waitForTransaction, publicClient } }: MUD, txPromise: Promise<Hex>) {
  let receipt: TransactionReceipt | undefined = undefined;

  try {
    const txHash = await txPromise;
    await waitForTransaction(txHash);
    console.log("[Tx] hash: ", txHash);

    // If the transaction runs out of gas, status will be reverted
    // receipt.status is of type TStatus = 'success' | 'reverted' defined in TransactionReceipt
    receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    if (receipt && receipt.status === "reverted") {
      // Force a CallExecutionError such that we can get the revert reason
      await callTransaction(publicClient, txHash);
      toast.error("[Insufficient Gas Limit] You're moving fast! Please wait a moment and then try again.");
    }
    return receipt;
  } catch (error) {
    console.error(error);
    try {
      if (error instanceof ContractFunctionExecutionError) {
        // Thrown by network.waitForTransaction, no receipt is returned
        const reason = error.cause.shortMessage;
        toast.warn(reason);
        return receipt;
      } else if (error instanceof CallExecutionError) {
        // Thrown by callTransaction, receipt is returned
        const reason = error.cause.shortMessage;
        toast.warn(reason);
        return receipt;
      } else {
        toast.error(`${error}`);
        return receipt;
      }
    } catch (error) {
      console.error(error);
      // As of MUDv1, this would most likely be a gas error. i.e.:
      //     TypeError: Cannot set properties of null (setting 'gasPrice')
      // so we told the user to try again.
      // However, this is not the case for MUDv2, as network.waitForTransaction no longer
      // throws an error if the transaction fails.
      // We should be on the lookout for other errors that could be thrown here.
      toast.error(`${error}`);
      return receipt;
    }
  }
}

// Function that takes in a transaction promise that resolves to a completed transaction
// Alerts the user if the transaction failed
// Providers renamed to client: https://viem.sh/docs/ethers-migration.html

type ExecuteCallOptions<FunctionName extends string = string> = Omit<
  SystemCall<typeof IWorldAbi, FunctionName>,
  "abi"
> & {
  mud: MUD;
  withSession?: boolean;
  options?: { gas?: bigint };
};

export async function execute<T extends keyof MetadataTypes, FunctionName extends string = string>(
  { mud, systemId, functionName, args, withSession, options: callOptions }: ExecuteCallOptions<FunctionName>,
  txQueueOptions?: { id: Entity; type?: T; metadata?: MetadataTypes[T] },
  onComplete?: (receipt: TransactionReceipt | undefined) => void
) {
  const account = withSession ? mud.sessionAccount ?? mud.playerAccount : mud.playerAccount;
  const authorizing = account == mud.sessionAccount;
  console.log(
    `[Tx] Executing ${functionName} with address ${account.address.slice(0, 6)} ${
      withSession ? "(with session acct)" : ""
    }`
  );
  const queuedTx = async () => {
    if (authorizing && mud.sessionAccount) {
      const params = encodeSystemCallFrom({
        abi: IWorldAbi,
        from: mud.playerAccount.address,
        systemId,
        functionName,
        args,
      });
      const tx = await mud.sessionAccount.worldContract.write.callFrom(params, callOptions);
      return tx;
    }
    const tx = await mud.playerAccount.worldContract.write[functionName](args, callOptions);
    return tx;
  };

  if (txQueueOptions)
    components.TransactionQueue.enqueue(
      async () => {
        const txPromise = queuedTx();
        const receipt = await _execute(mud, txPromise);
        onComplete?.(receipt);
      },
      txQueueOptions.id,
      txQueueOptions.type,
      txQueueOptions.metadata
    );
  else {
    const txPromise = queuedTx();
    const receipt = await _execute(mud, txPromise);
    onComplete?.(receipt);
  }
}

export async function executeBatch<T extends keyof MetadataTypes, functionName extends string = string>(
  {
    mud,
    systemCalls,
    withSession,
  }: {
    systemCalls: readonly Omit<SystemCallFrom<typeof IWorldAbi, functionName>, "abi" | "from">[];
    mud: MUD;
    withSession?: boolean;
  },
  options?: { id: Entity; type?: T; metadata?: MetadataTypes[T] },
  onComplete?: (receipt: TransactionReceipt | undefined) => void
) {
  const account = withSession ? mud.sessionAccount ?? mud.playerAccount : mud.playerAccount;
  const authorizing = account !== mud.playerAccount;

  console.log(
    `[Tx] Executing batch: ${systemCalls.map(
      (system) => `${system.functionName} `
    )} with address ${account.address.slice(0, 6)} ${authorizing ? "(using session account)" : ""}`
  );

  const queuedTx = async () => {
    if (authorizing && mud.sessionAccount) {
      const params = encodeSystemCallsFrom(IWorldAbi, mud.playerAccount.address, systemCalls).map(
        ([systemId, callData]) => ({ from: mud.playerAccount.address, systemId, callData })
      );
      const tx = await mud.sessionAccount.worldContract.write.batchCallFrom([params]);
      return tx;
    }
    const params = encodeSystemCalls(IWorldAbi, systemCalls).map(([systemId, callData]) => ({ systemId, callData }));
    const tx = await mud.playerAccount.worldContract.write.batchCall([params]);
    return tx;
  };

  if (options)
    components.TransactionQueue.enqueue(
      async () => {
        const txPromise = queuedTx();
        const receipt = await _execute(mud, txPromise);
        onComplete?.(receipt);
      },
      options.id,
      options.type,
      options.metadata
    );
  else {
    const txPromise = queuedTx();
    const receipt = await _execute(mud, txPromise);
    onComplete?.(receipt);
  }
}
// Call from a hash to force a CallExecutionError such that we can get the revert reason
export async function callTransaction(publicClient: PublicClient, txHash: Hex): Promise<void> {
  const tx = await publicClient.getTransaction({ hash: txHash });
  if (!tx) throw new Error("Transaction does not exist");
  await publicClient.call({
    account: tx.from!,
    to: tx.to!,
    data: tx.input,
  });
}
