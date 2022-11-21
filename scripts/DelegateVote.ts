import * as dotenv from "dotenv";
import { Wallet } from "ethers";
import { AlchemyProvider, InfuraProvider } from "@ethersproject/providers";
import { Ballot, Ballot__factory, MyToken } from "../typechain-types";
import { MyToken__factory } from "../typechain-types/factories/contracts/ERC20Votes.sol/MyToken__factory";
dotenv.config();

async function main() {
  let args = process.argv;
  let params = args.slice(2); //slice(2) returns 3rd and following parts
  let proposals;

  //Deploy on Goerli accepting in an account address:
  //const provider = new InfuraProvider("goerli", process.env.INFURA_KEY);
  const provider = new AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
  const wallet = new Wallet(process.env.PRIVATE_KEY ?? "");
  const signer = wallet.connect(provider);
  console.log(`Signer (delegating from) address: ${signer.address}`);
  const contractAddress = params[0];
  const newDelegateAccount = params[1];

  const myTokenFactory = new MyToken__factory(signer);
  let myTokenContract: MyToken = await myTokenFactory.attach(contractAddress);

  const delegateTx = await myTokenContract.delegate(newDelegateAccount);

  const delegateReceipt = await delegateTx.wait();

  console.log(`receipt hashcode for tx is: ${delegateReceipt.transactionHash}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
