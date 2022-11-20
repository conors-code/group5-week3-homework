import { ethers } from "hardhat";  //or ethers if not using contract factory
import * as dotenv from "dotenv";
import { Ballot, Ballot__factory, ERC20Votes__factory, MyToken__factory } from "../typechain-types";
import { Wallet } from "ethers";
dotenv.config();

const TEST_MINT_VALUE = ethers.utils.parseEther("10");

//Convert strings to Bytes32 for Solidity.
function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function main() {
  
  let args = process.argv;
  let params = args.slice(2); //slice(2) returns 3rd and following parts
  let proposals;

  console.log(params);

  //Deploy on Goerli accepting in an account address:  
  const provider = ethers.getDefaultProvider("goerli");
  //const provider = ethers.getDefaultProvider("goerli", {infura});
  console.log(process.env.PRIVATE_KEY?.length); //don't show the private key
  console.log(process.env.MNEMONIC?.length); //don't show the mnemonic

  //make it fail quickly without the key / mnemonic, using ??
  const wallet = new Wallet(process.env.PRIVATE_KEY ?? "");
  //or
  //const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC ?? "");
  const signer = wallet.connect(provider);
  //balance is a big number :-)  Ensure we have enough for gas anyway.
  const balanceBN = await signer.getBalance();
  console.log(
    `Connected to the account of address ${signer.address}\n
    This account has a balance of ${balanceBN.toString()} Wei`
  );

  //1st param is the number of blocks to add to deployment time lastBlock, to give
  //  time for voting etc.  The rest of the params are the proposals
const lastBlock = await (await provider.getBlock("latest")).number;
 let targetBlock;
  if (params.length > 0) {
    if (params.length > 1 && Number(params[0])) {
      const targetBlockOffset = Number(params[0]);
      console.log(`Targeting block ${targetBlockOffset} blocks into future for voting`);
      targetBlock = lastBlock + targetBlockOffset;
      //the rest of the params are the proposals.
      proposals = params.slice(1);
    } else {
      throw new Error("Proposals must be provided for deployment");
    }    
  } else {
    throw new Error("Target block offset and proposals must be provided for deployment");
  }


  //Get the latest block and add, say 3, to give a chance to make changes before
  //  voting power is checked
  console.log(`last lock is ${lastBlock}, targetBlock is ${targetBlock}`);

  console.log("Deploying VoteToken contract");
  const voteContractFactory = new MyToken__factory(signer);
  const voteTokenContract = await voteContractFactory.deploy();
  await voteTokenContract.deployed();
  console.log("vote contract deployed at " + voteTokenContract.address);
  const ballotContractFactory = new Ballot__factory(signer);
  console.log("Deploying Ballot contract");
  let ballotContract: Ballot;

  ballotContract = await ballotContractFactory.deploy(
    convertStringArrayToBytes32(proposals),
    voteTokenContract.address, targetBlock) as Ballot;
  await ballotContract.deployed();
  console.log("Tokenised ballot contract deployed at " + ballotContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
