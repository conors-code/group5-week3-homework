import * as dotenv from "dotenv";
import { Wallet, ethers } from "ethers";
import { AlchemyProvider, InfuraProvider } from "@ethersproject/providers";
import { Ballot, Ballot__factory } from "../typechain-types";
dotenv.config();

async function main() {
  let args = process.argv;
  let params = args.slice(2); //slice(2) returns 3rd and following parts
  

  //Deploy on Goerli accepting in an account address:
  const provider = new AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
  //const provider = new InfuraProvider("goerli", process.env.INFURA_KEY);
  const wallet = new Wallet(process.env.PRIVATE_KEY ?? "");
  const signer = wallet.connect(provider);
  const ballotContractAddress = params[0];
  const accountAddressToCheck = params[1];

  const ballotContractFactory = new Ballot__factory(signer);
  const ballotContract: Ballot = ballotContractFactory.attach(ballotContractAddress);

  const votePower = await ballotContract.votePower(accountAddressToCheck);
  console.log (`vote power is ${votePower} for account ${accountAddressToCheck}`);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
