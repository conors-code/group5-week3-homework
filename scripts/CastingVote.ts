import * as dotenv from "dotenv";
import { Wallet } from "ethers";
import { InfuraProvider } from "@ethersproject/providers";
import { Ballot, Ballot__factory } from "../typechain-types";

dotenv.config();

async function main() {
  let args = process.argv;
  let params = args.slice(2); //slice(2) returns 3rd and following parts
  let proposals;

  //Deploy on Goerli accepting in an account address:
  const provider = new InfuraProvider("goerli", process.env.INFURA_KEY);
  const wallet = new Wallet(process.env.PRIVATE_KEY ?? "");
  const signer = wallet.connect(provider);
  const contractAddress = params[0];
  const proposalNumber = params[1];
  const voteAmount = params[2];

  const ballotFactory = new Ballot__factory(signer);
  let ballotContract: Ballot = await ballotFactory.attach(contractAddress);

  const voteTx = await ballotContract.vote(proposalNumber, voteAmount);

  const voteReceipt = await voteTx.wait();

  console.log(`receipt hashcode for tx is: ${voteReceipt.transactionHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
