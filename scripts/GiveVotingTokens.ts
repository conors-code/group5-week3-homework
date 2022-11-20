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
  const voteContractAddress = params[0];
  const transferRecipientAddress = params[1];
  const transferAmount = params[2];

  const voteTokenFactory = new MyToken__factory(signer);
  let voteTokenContract: MyToken = await voteTokenFactory.attach(voteContractAddress);

  const numOfTokensToTransfer = ethers.utils.parseEther(transferAmount);
  
  const transferTx = await voteTokenContract.connect(signer).transfer(
    transferRecipientAddress,
    numOfTokensToTransfer);
  await transferTx.wait();

  console.log(`receipt hashcode for tx is: ${transferTx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
