import { ethers, Wallet } from "ethers";
import { Ballot, Ballot__factory, factories } from "../typechain-types";
import * as dotenv from "dotenv";
import { AlchemyProvider, InfuraProvider } from "@ethersproject/providers";
dotenv.config();

async function main() {
  const provider = new AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
  //const provider = new InfuraProvider("goerli", process.env.INFURA_KEY);
  
  console.log(process.env.PRIVATE_KEY?.length);

  //make it fail quickly if we don't have the key / mnemonic, using ??
  const wallet = new Wallet(process.env.PRIVATE_KEY ?? "");

  const signer = wallet.connect(provider);

  const args = process.argv;
  const params = args.slice(2); //3nd parameter is the 1st passed in parameter
  const contractAddress = params[0]; //the passed in address of the contract

  const ballotContractFactory = new Ballot__factory(signer);
  let ballotContract: Ballot = ballotContractFactory.attach(
    contractAddress
  );

  const winningProposalNumber = await ballotContract.winningProposal();

  const voteCount = await ballotContract.winnerVoteCount();

  const winnerNameBytes32 = await ballotContract.winnerName();

  const winnerName = ethers.utils.parseBytes32String(winnerNameBytes32);

  console.log(
    `Winning proposal index is ${winningProposalNumber} named ${winnerName}, with ${voteCount} votes.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
