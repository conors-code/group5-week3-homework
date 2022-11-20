import { Ballot, MyToken } from "../typechain-types";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { TIMEOUT } from "dns";

const PROPOSALS = ["Supercool", "Chilled","Tepid"];
const TEST_MINT_VALUE = ethers.utils.parseEther("100");


//won't work with long strings that can't be represented in 32 bytes.
function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
      bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
  }
      

describe("TokenisedBallot - Delegate", async function () {
//describe("Ballot", async () => {  //cannot use this keyword with lambda.
    //15 seconds: default 2 sconds too short. Using this keyword, hence no 
    //fat arrow in the outer describe and addition of function keyword.
    this.timeout(15000); 
    let ballotContract: Ballot;
    let voteTokenContract : MyToken
    let accounts : SignerWithAddress[];
    let voter : SignerWithAddress 
    let minter : SignerWithAddress;
    let other : SignerWithAddress;
    const TARGET_BLOCK = 5; 
    const VOTE_TOKEN_NAME = "Group 5 Votes";
    const VOTE_TOKEN_ID = "G5V";

    beforeEach(async () => {
        accounts = await ethers.getSigners();
        [minter, voter, other] = accounts; // idx 0, 1, 2

        const voteContractFactory = await ethers.getContractFactory("MyToken");
        voteTokenContract = await voteContractFactory.deploy();
        await voteTokenContract.deployed();
        //console.log("vote contract deployed at " + voteTokenContract.address);

        const ballotContractFactory = await ethers.getContractFactory("Ballot");
        ballotContract = await ballotContractFactory.deploy(
            convertStringArrayToBytes32(PROPOSALS),
            voteTokenContract.address, TARGET_BLOCK) as Ballot;
        await ballotContract.deployed();
        //console.log("ballot contract deployed at " + ballotContract.address);
                
        let voterTokenBalance = await voteTokenContract.balanceOf(voter.address);
        //console.log(`Voter token balance at beginning is ${voterTokenBalance}`);


    });

    describe("When the delegation has taken place", async () => {
        
        it("before mint and delegation, voting power is 0", async () => {
            //need to mine a transaction first to get a block.
            const voterVotePower = await voteTokenContract.getVotes(voter.address);
            console.log(`Voter vote power at outset is ${voterVotePower}`); // 0 
            const minterVotePower = await voteTokenContract.getVotes(minter.address);
            console.log(`Minter vote power at outset is ${minterVotePower}`); // 0 
            expect(minterVotePower).to.eq(0);
            expect(voterVotePower).to.eq(0);
        });
        it("after mint and before delegation, voter voting power is still 0", async () => {
            const mintTx =  await voteTokenContract.mint(voter.address, TEST_MINT_VALUE);
            await mintTx.wait();
            const postMintVoterVotePower = await voteTokenContract.getVotes(voter.address);
            expect(postMintVoterVotePower).to.eq(0);
        });
        it("after mint and after delegation, voter voting power matches mint", async () => {
            const mintTx =  await voteTokenContract.mint(voter.address, TEST_MINT_VALUE);
            await mintTx.wait(); 
            const delegateTx = await voteTokenContract.connect(voter).delegate(voter.address);
            await delegateTx.wait();            
            let votePowerPostDelegateToSelf = await voteTokenContract.getVotes(voter.address);
            const postMintVoterVotePower = await voteTokenContract.getVotes(voter.address);
            expect(postMintVoterVotePower, 
               `expected post-mint, post delegation voting power to equal mint value of 
               ${TEST_MINT_VALUE}, but is ${votePowerPostDelegateToSelf}`).to.eq(TEST_MINT_VALUE);
        });
    });
});