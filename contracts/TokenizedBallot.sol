// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./ERC20Votes.sol";

contract Ballot {
    
    MyToken public voteToken;

    uint256 public targetBlock;

    struct Proposal {
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }
    
    //struct for returning all proposal info in an array
    struct ProposalInfo {
        uint idx; //index position
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
        bytes32 isWinning; //whether or not this proposal is winning
    }

    mapping(address => uint256) public votePowerSpent;

    Proposal[] public proposals;

    /// Create a new ballot to choose one of `proposalNames`.
    constructor(bytes32[] memory proposalNames, address _voteToken, uint256 _targetBlock) {
        targetBlock = _targetBlock;
        voteToken = MyToken(_voteToken);
        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }


    /// can vote with amount
    //each msg.sender has an amount of availableVotePower
    function vote(uint proposal, uint256 _amount) external {
        require((_amount <= votePower(msg.sender)), "Amount less than remaining vote power");
        // If `proposal` is out of the range of the array,
        // this will throw automatically and revert all
        // changes.
        proposals[proposal].voteCount += _amount;
        votePowerSpent[msg.sender] += _amount;
    }

    function votePower(address account) public view returns(uint256) {
        //TODO: (pastVotePower on the erc20) - (spentVotePower)
        return voteToken.getPastVotes(account, targetBlock) - 
          votePowerSpent[account];
    }

    /// @dev Computes the winning proposal taking all
    /// previous votes into account.
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the name of the winner
    function winnerName() external view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the vote count of the winner
    function winnerVoteCount() external view
            returns (uint winnerVoteCount_)
    {
        winnerVoteCount_ = proposals[winningProposal()].voteCount ;
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the vote count of the winner
    function proposalsInfo() external view
            returns (ProposalInfo[] memory)
    {
        ProposalInfo[] memory allProposalsInfo = new ProposalInfo[](proposals.length);
        for (uint i = 0; i < proposals.length; i++) {
          bytes32 currentProposalIsWinning = 'No';
          if (i == winningProposal()) {
            currentProposalIsWinning = '**Yes!**';
          }
          ProposalInfo memory currentProposal = ProposalInfo({
                idx: i,
                name: proposals[i].name,
                voteCount: proposals[i].voteCount,
                isWinning: currentProposalIsWinning
            });
          allProposalsInfo[i] = currentProposal;
        }
        return allProposalsInfo;
    }
}