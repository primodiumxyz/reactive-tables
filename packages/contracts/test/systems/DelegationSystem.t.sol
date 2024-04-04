// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import "test/PrimodiumTest.t.sol";
import { UserDelegationControl } from "@latticexyz/world/src/codegen/index.sol";
import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { UNLIMITED_DELEGATION } from "@latticexyz/world/src/constants.sol";

contract DelegationSystemTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
    vm.startPrank(creator);
    world.spawn();
  }

  function testSetUnlimitedAuthorizedAccount() public {
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), bytes32(""));
    world.registerDelegation(alice, UNLIMITED_DELEGATION, new bytes(0));
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), ResourceId.unwrap(UNLIMITED_DELEGATION));
  }

  function testRemoveUnlimitedAuthorizedAccount() public {
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), bytes32(""));
    world.registerDelegation(alice, UNLIMITED_DELEGATION, new bytes(0));
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), ResourceId.unwrap(UNLIMITED_DELEGATION));
    world.unregisterDelegation(alice);
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), bytes32(""));
  }

  function testSwitchUnlimitedAuthorizedAccount() public {
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), bytes32(""));
    world.registerDelegation(alice, UNLIMITED_DELEGATION, new bytes(0));
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), ResourceId.unwrap(UNLIMITED_DELEGATION));
    world.switchDelegation(alice, bob, UNLIMITED_DELEGATION, new bytes(0));
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, alice)), bytes32(""));
    assertEq(ResourceId.unwrap(UserDelegationControl.get(creator, bob)), ResourceId.unwrap(UNLIMITED_DELEGATION));
  }
}
