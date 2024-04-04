// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

import { SetAllianceMembers, SetIndexForAllianceMembers } from "codegen/index.sol";

library AllianceMembersSet {
  function add(bytes32 alliance, bytes32 member) internal {
    require(!SetIndexForAllianceMembers.getStored(alliance, member), "[Alliance]: member already in Alliance");
    SetIndexForAllianceMembers.set(alliance, member, true, SetAllianceMembers.length(alliance));
    SetAllianceMembers.push(alliance, member);
  }

  function clear(bytes32 alliance) internal {
    bytes32[] memory members = SetAllianceMembers.get(alliance);
    for (uint256 i = 0; i < members.length; i++) {
      SetIndexForAllianceMembers.deleteRecord(alliance, members[i]);
    }
    SetAllianceMembers.deleteRecord(alliance);
  }

  function remove(bytes32 alliance, bytes32 member) internal {
    require(SetIndexForAllianceMembers.getStored(alliance, member), "[Alliance]: member not part of Alliance");
    uint256 index = SetIndexForAllianceMembers.getIndex(alliance, member);
    if (index == SetAllianceMembers.length(alliance) - 1) {
      SetAllianceMembers.pop(alliance);
      SetIndexForAllianceMembers.deleteRecord(alliance, member);
      return;
    }
    SetIndexForAllianceMembers.deleteRecord(alliance, member);
    bytes32 lastMember = SetAllianceMembers.getItem(alliance, SetAllianceMembers.length(alliance) - 1);
    SetAllianceMembers.pop(alliance);
    SetAllianceMembers.update(alliance, index, lastMember);
    SetIndexForAllianceMembers.set(alliance, lastMember, true, index);
  }

  function getMembers(bytes32 alliance) internal view returns (bytes32[] memory) {
    return SetAllianceMembers.get(alliance);
  }

  function length(bytes32 alliance) internal view returns (uint256) {
    return SetAllianceMembers.length(alliance);
  }
}
