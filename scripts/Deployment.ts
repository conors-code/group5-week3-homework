import { ethers } from "hardhat";  //or ethers if not using contract factory
import * as dotenv from "dotenv";
import { ERC20Votes__factory, MyToken__factory } from "../typechain-types";
dotenv.config();

const TEST_MINT_VALUE = ethers.utils.parseEther("10");

async function main() {
  
  let args = process.argv;
  let params = args.slice(2); //slice(2) returns 3rd and following parts
  
  console.log(params);

  /*//when we're ready to deploy on Goerli, use the network:
  
  const provider = ethers.getDefaultProvider("goerli");
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
  
  */

  const accounts = await ethers.getSigners();
  //call mint to charge it up with money.  Need a voter and other
  const [minter,voter, other] = accounts; // idx 0, 1, 2
  //for weekend project
  //const account = new ethers.Wallet.fromMnemonic("MNEMONIC");
  const erc20VotesFactory = new MyToken__factory(accounts[0]);
  const contract20V = await erc20VotesFactory.deploy();
  await contract20V.deployed();
  console.log(`Tokenized votes contract deployed at ${contract20V.address}`);

  let voterTokenBalance = await contract20V.balanceOf(voter.address);

  console.log(`Voter token balance pre-mint is ${voterTokenBalance}`);
  const mintTx =  await contract20V.mint(voter.address, TEST_MINT_VALUE);

  
  let voterTokenBalancePostMint = await contract20V.balanceOf(voter.address);
  console.log(`Voter token balance post-mint is ${voterTokenBalancePostMint}`);

  let votePower = await contract20V.getVotes(voter.address);
  console.log(`Voter vote power post-mint is ${votePower}`); //still 0 

  const delegateTx = await contract20V.connect(voter).delegate(voter.address);
  
  let votePowerPostDelegateToSelf = await contract20V.getVotes(voter.address);
  //same as #tokens now
  console.log(`Voter vote power post-mint & delegate to self is ${votePowerPostDelegateToSelf}`); 

  const transferTx = await contract20V.connect(voter).transfer(
    other.address,
    TEST_MINT_VALUE.div(2));
  await transferTx.wait();
  let votePowerAfterTransfer = await contract20V.getVotes(voter.address);
  console.log(`Voter vote power post-transfer is ${votePowerAfterTransfer}`); //still 0 
  let votePowerOtherAfterTransfer = await contract20V.getVotes(other.address);
  console.log(`Other vote power post-transfer is ${votePowerOtherAfterTransfer}`); //still 0 

  /*
  //This segment is just to add another block so we can see a transaction after
  //  the transfer, so we can see the halving of the voting power after transfer
  const delegateOtherTx = await contract20V.connect(other).delegate(other.address);
  await delegateOtherTx.wait();
  votePower = await contract20V.getVotes(other.address);
  console.log(`After the self delegation, the other account has ${votePower} decimals of vote power\n`);
  */

  //use next line locally, on Goerli delete/comment out in favour of next line
  const currentBlock = await ethers.provider.getBlock("latest");

  //When we're on Goerli, use this to get the block number
  //const currentBlock = provider.getBlock("latest");
  //console.log(currentBlock);

  //take 1 from blockNumber: As current one is not yet mined, this is not in the past
  //and will give us an error if we try to use that number.
  for (let blockNumber = currentBlock.number - 1; blockNumber >= 0; blockNumber--) {
    const pastVotePower = await contract20V.getPastVotes(voter.address, blockNumber);
    console.log(`past vote power is ${pastVotePower}`);
  }
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
