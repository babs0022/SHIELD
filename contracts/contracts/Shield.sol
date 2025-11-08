// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Shield {
    struct AccessPolicy {
        address sender;
        address recipient;
        uint64 expiry;
        uint32 maxAttempts;
        uint32 attempts;
        bool valid;
    }

    mapping(bytes32 => AccessPolicy) public policies;

    event PolicyCreated(bytes32 indexed policyId, address indexed sender, address indexed recipient, uint256 expiry, uint256 maxAttempts);
    event VerificationAttempt(bytes32 indexed policyId, bool success);

    function createPolicy(bytes32 policyId, address recipient, uint256 expiry, uint256 maxAttempts) external {
        require(policies[policyId].sender == address(0), "Policy already exists");
        policies[policyId] = AccessPolicy({
            sender: msg.sender,
            recipient: recipient,
            expiry: uint64(expiry),
            maxAttempts: uint32(maxAttempts),
            attempts: 0,
            valid: true
        });
        emit PolicyCreated(policyId, msg.sender, recipient, expiry, maxAttempts);
    }

    function logAttempt(bytes32 policyId, bool success) external {
        AccessPolicy storage policy = policies[policyId];
        require(policy.sender != address(0), "Policy does not exist");
        require(policy.valid, "Policy is not valid");
        require(block.timestamp < policy.expiry, "Policy has expired");
        require(policy.attempts < policy.maxAttempts, "Max attempts reached");

        policy.attempts++;

        if (!success) {
            if (policy.attempts >= policy.maxAttempts) {
                policy.valid = false;
            }
        }

        emit VerificationAttempt(policyId, success);

        if (success) {
            policy.valid = false; // Invalidate after successful access
        }
    }

    function isPolicyValid(bytes32 policyId) external view returns (bool) {
        AccessPolicy storage policy = policies[policyId];
        return policy.valid && block.timestamp < policy.expiry && policy.attempts < policy.maxAttempts;
    }
}
