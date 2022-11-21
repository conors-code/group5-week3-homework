import * as dotenv from "dotenv";
import { Wallet, ethers } from "ethers";
import { AlchemyProvider, InfuraProvider } from "@ethersproject/providers";
import { Ballot, Ballot__factory, MyToken } from "../typechain-types";
import { MyToken__factory } from "../typechain-types/factories/contracts/ERC20Votes.sol/MyToken__factory";
dotenv.config();

async function main() {
  let args = process.argv;
  let params = args.slice(2); //slice(2) returns 3rd and following parts
  

  //Deploy on Goerli accepting in an account address:
  const provider = new AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
  //const provider = new InfuraProvider("goerli", process.env.INFURA_KEY);
  const wallet = new Wallet(process.env.PRIVATE_KEY ?? "");
  const signer = wallet.connect(provider);
  console.log(`Signer (minting requested by) address: ${signer.address}`);
  const voteContractAddress = params[0];
  const mintRecipientAccount = params[1];
  const numOfTokensToMintInput = params[2];

  const voteTokenFactory = new MyToken__factory(signer);
  let voteTokenContract: MyToken = voteTokenFactory.attach(voteContractAddress);

  const numOfTokensToMint = ethers.utils.parseEther(numOfTokensToMintInput);
  const mintTx =  await voteTokenContract.mint(mintRecipientAccount, numOfTokensToMint);
  await mintTx.wait(); 
  console.log(`receipt hashcode for mint tx is: ${mintTx.hash}`);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
