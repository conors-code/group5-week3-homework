import { Ballot, MyToken } from "../typechain-types";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

const PROPOSALS = ["Matheus 4 President", "Steve 4 chancellor", "Encode FTW"];


//won't work with long strings that can't be represented in 32 bytes.
function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}
      

describe("Ballot Winner", async function () {

  this.timeout(15000); 
  let ballotContract: Ballot;
  let voteTokenContract : MyToken
  let accounts : SignerWithAddress[];
  const TARGET_BLOCK_OFFSET = 4; 
  const VOTE_TOKEN_NAME = "Group 5 Votes";
  const VOTE_TOKEN_ID = "G5V";
  const TEST_ETH_TOKENS = ethers.utils.parseEther("20");
  const VOTE_AMOUNT = ethers.utils.parseEther("5");
  const CHOOSE_LAST_PROPOSAL = 2;  //pick the last one to make sure it's no 0 default

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const lastBlock = (await ethers.provider.getBlock("latest")).number;

    const voteContractFactory = await ethers.getContractFactory("MyToken");
    voteTokenContract = await voteContractFactory.deploy();
    await voteTokenContract.deployed();
    console.log("vote contract deployed at " + voteTokenContract.address);
    //this needs to be converted from the Byte32 to String.  It must be 
    //done for each of them.  it could be done with a helper function to
    //loop through the array for each String entrty, or a map.
    const ballotContractFactory = await ethers.getContractFactory("Ballot");
    ballotContract = await ballotContractFactory.deploy(
        convertStringArrayToBytes32(PROPOSALS),
        voteTokenContract.address, (lastBlock + TARGET_BLOCK_OFFSET)) as Ballot;
    await ballotContract.deployed();
    console.log("ballot contract deployed at " + ballotContract.address);
          
    const mintTx =  await voteTokenContract.mint(accounts[0].address, TEST_ETH_TOKENS);
    await mintTx.wait(); 
    //self delegate for tests to give voting power
    const delegateTx = await voteTokenContract.connect(accounts[0]).delegate(accounts[0].address);
    await delegateTx.wait();
    
    const voteTx = await ballotContract.connect(accounts[0]).vote(CHOOSE_LAST_PROPOSAL, VOTE_AMOUNT);
    await voteTx.wait();
  });

  describe("The winning proposal", async () => {
    it("must have the most votes", async () => {
      const contractAddress = ballotContract.address;
      //vote for a proposal to give it the most votes.  This index should be returned
      /*const chosenProposalIndex = 1;
      const firstVoteTxReceipt = await ballotContract.vote(chosenProposalIndex); */
      const winningProposalNumber = await ballotContract.winningProposal();
      
      expect(CHOOSE_LAST_PROPOSAL,
        `Voted for proposal ${CHOOSE_LAST_PROPOSAL} but ${winningProposalNumber} won.`
      ).to.equal(winningProposalNumber);
    });
    
    it("must have proposal name matching correct index", async () => {
      //vote for a proposal to give it the most votes.  index should match proposal name
      //const chosenProposalIndex = 2;
      //const firstVoteTxReceipt = await ballotContract.vote(chosenProposalIndex);
      const winningProposalNumber = await ballotContract.winningProposal();

      const expectedWinnerName = PROPOSALS[CHOOSE_LAST_PROPOSAL];

      const winnerNameBytes32 = await ballotContract.winnerName();
      const winnerName = ethers.utils.parseBytes32String(winnerNameBytes32);

      expect(winnerName,
        `Winner name should be ${expectedWinnerName} but is ${winnerName}.`
      ).to.equal(expectedWinnerName);
    });
    /* //commented out as Seth removed the winnerVoteCount from the contract.
    it("must have more than 0 votes", async () => {
      //vote for a proposal to give it the most votes.  index should match proposal name
      //const chosenProposalIndex = 2;
      //const firstVoteTxReceipt = await ballotContract.vote(chosenProposalIndex);
      const winningProposalNumber = await ballotContract.winningProposal();

      const expectedWinnerName = PROPOSALS[CHOOSE_LAST_PROPOSAL];

      const winnerVoteCount = await ballotContract.winnerVoteCount();
      console.log("winner vote count is" + winnerVoteCount);

      expect(winnerVoteCount,
        `Winner number of votes should be ${VOTE_AMOUNT} but is ${winnerVoteCount}.`
      ).to.equal(VOTE_AMOUNT);
    });*/
  });
});