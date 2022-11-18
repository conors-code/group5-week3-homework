import { Ballot, MyToken } from "../typechain-types/";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { TIMEOUT } from "dns";

const PROPOSALS = ["Supercool", "Chilled","Tepid"];


//won't work with long strings that can't be represented in 32 bytes.
function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
      bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
  }
      

describe("TokenisedBallot", async function () {
//describe("Ballot", async () => {  //cannot use this keyword with lambda.
    //15 seconds: default 2 sconds too short. Using this keyword, hence no 
    //fat arrow in the outer describe and addition of function keyword.
    this.timeout(15000); 
    let ballotContract: Ballot;
    let voteToken : MyToken
    let accounts : SignerWithAddress[];
    const TARGET_BLOCK = 5; 
    const VOTE_TOKEN_NAME = "Group 5 Votes";
    const VOTE_TOKEN_ID = "G5V";

    beforeEach(async () => {
        const voteContractFactory = await ethers.getContractFactory("MyToken");
        voteToken = await voteContractFactory.deploy();
        await voteToken.deployed();
        //this needs to be converted from the Byte32 to String.  It must be 
        //done for each of them.  it could be done with a helper function to
        //loop through the array for each String entrty, or a map.
        const ballotContractFactory = await ethers.getContractFactory("Ballot");
        ballotContract = await ballotContractFactory.deploy(
            convertStringArrayToBytes32(PROPOSALS),
            voteToken.address, TARGET_BLOCK) as Ballot;
        
        accounts = await ethers.getSigners();
    });

    describe("when the contract is deployed", async () => {
        it("has the provided proposals", async () => {
            //this won't work because we can't get the array at once
            //if array of Structs, etc.  Can only get an array type of
            //bytes at once. 
            /*
            const proposals = await ballotContract.proposals();
            expect(proposals).to.equal(PROPOSALS);
            */
           //can get each el one at a time
            for (let i = 0; i < PROPOSALS.length; i++) {
                const proposal = await ballotContract.proposals(i);
                expect(ethers.utils.parseBytes32String(proposal.name)).to.eq(PROPOSALS[i]);
            }
        });
        
        it("Has 0 vote power until delegation", async () => {
            const Account0VotePower = await ballotContract.votePower(accounts[0].address);
            expect(0).to.equal(Account0VotePower);
        });
    });
});