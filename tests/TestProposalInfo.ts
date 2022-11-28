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
      

describe("Ballot Proposals Info", async function () {

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

  describe("When ProposalInfos are returned", async () => {
    it("they must have the info to display for each proposal", async () => {
      const contractAddress = ballotContract.address;
      //vote for a proposal to give it the most votes.  This index should be returned
      /*const chosenProposalIndex = 1;
      const firstVoteTxReceipt = await ballotContract.vote(chosenProposalIndex); */
      let proposalInfos: Ballot.ProposalInfoStructOutput[] = await ballotContract.proposalsInfo();


      expect(proposalInfos.length,
        `Expected ${PROPOSALS.length} proposals but was ${proposalInfos.length}.`
      ).to.equal(PROPOSALS.length);

      const winnerIsWinning = ethers.utils.parseBytes32String(
        proposalInfos[CHOOSE_LAST_PROPOSAL].isWinning
      );
      const nonWinnerIsWinning = ethers.utils.parseBytes32String(
        proposalInfos[0].isWinning
      );

      expect(winnerIsWinning,
        `Expected **Yes!** for winner indication but was ${winnerIsWinning}.`
        ).to.equal("**Yes!**");
      expect(nonWinnerIsWinning,
          `Expected No for winner indication but was ${nonWinnerIsWinning}.`
        ).to.equal("No");

      const expectedPosn1Name = PROPOSALS[1];
      const actualPosn1Name = ethers.utils.parseBytes32String(proposalInfos[1].name);

      expect(actualPosn1Name,
        `Expected ${expectedPosn1Name} for winner indication but was ${actualPosn1Name}.`
        ).to.equal(expectedPosn1Name);
  
      const expectedWinningVoteCount = VOTE_AMOUNT;
      const actualWinningVoteCount = proposalInfos[CHOOSE_LAST_PROPOSAL].voteCount;
      expect(actualWinningVoteCount,
        `Expected ${expectedWinningVoteCount} for winner vote count but was ${actualWinningVoteCount}.`
        ).to.equal(expectedWinningVoteCount);
    });
  });
});