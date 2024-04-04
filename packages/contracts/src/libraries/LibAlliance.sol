// SPDX-License-Identifier: MIT
pragma solidity >=0.8.21;

// tables
import { P_AllianceConfig, Score, AllianceJoinRequest, PlayerAlliance, Alliance, AllianceData, AllianceInvitation } from "codegen/index.sol";

// libraries
import { LibEncode } from "libraries/LibEncode.sol";
import { AllianceMembersSet } from "libraries/AllianceMembersSet.sol";

// types
import { AllianceKey } from "src/Keys.sol";
import { EAllianceRole, EAllianceInviteMode } from "src/Types.sol";

library LibAlliance {
  /**
   * @dev Checks for a player not to be part of an alliance.
   * @param playerEntity The entity ID of the player.
   */
  function checkNotMemberOfAnyAlliance(bytes32 playerEntity) internal view {
    require(PlayerAlliance.getAlliance(playerEntity) == 0, "[Alliance] Player is already part of an alliance");
  }

  /**
   * @dev Checks if a player is part of an alliance.
   * @param playerEntity The entity ID of the player.
   * @param allianceEntity The entity ID of the alliance.
   */
  function checkPlayerPartOfAlliance(bytes32 playerEntity, bytes32 allianceEntity) internal view {
    require(
      PlayerAlliance.getAlliance(playerEntity) == allianceEntity,
      "[Alliance] Player is not part of the alliance"
    );
  }

  /**
   * @dev Checks if a alliance has space for new member.
   * @param allianceEntity The entity ID of the alliance.
   */
  function checkAllianceMaxJoinLimit(bytes32 allianceEntity) internal view {
    require(AllianceMembersSet.length(allianceEntity) < P_AllianceConfig.get(), "[Alliance] Alliance is full");
  }

  /**
   * @dev Checks if a new player can join an alliance.
   * @param playerEntity The entity ID of the player.
   * @param allianceEntity The entity ID of the alliance.
   */
  function checkCanNewPlayerJoinAlliance(bytes32 playerEntity, bytes32 allianceEntity) internal view {
    bytes32 inviter = AllianceInvitation.getInviter(playerEntity, allianceEntity);
    require(
      Alliance.getInviteMode(allianceEntity) == uint8(EAllianceInviteMode.Open) || inviter != 0,
      "[Alliance] Either alliance is not open or player has not been invited"
    );
    return;
  }

  /**
   * @dev Checks if the player can grant a role to another player.
   * @param playerEntity The entity ID of the player granting the role.
   * @param toBeGranted The entity ID of the player receiving the new role.
   * @param roleToBeGranted The role.
   */
  function checkCanGrantRole(bytes32 playerEntity, bytes32 toBeGranted, EAllianceRole roleToBeGranted) internal view {
    require(playerEntity != toBeGranted, "[Alliance] Can not grant role to self");
    uint8 role = PlayerAlliance.getRole(playerEntity);
    require(role <= uint8(roleToBeGranted), "[Alliance] Can not grant role higher then your own");
    require(role > 0 && role <= uint8(EAllianceRole.CanGrantRole), "[Alliance] Does not have permission to grant role");
    require(role < PlayerAlliance.getRole(toBeGranted), "[Alliance] Can not change role of superior");
  }

  /**
   * @dev Checks if the player can kick another player from the alliance.
   * @param playerEntity The entity ID of the player.
   * @param toBeKicked The entity ID of the player getting KICKED
   */
  function checkCanKick(bytes32 playerEntity, bytes32 toBeKicked) internal view {
    uint8 role = PlayerAlliance.getRole(playerEntity);
    require(role > 0 && role <= uint8(EAllianceRole.CanKick), "[Alliance] Player does not have permission to kick");
    require(role < PlayerAlliance.getRole(toBeKicked), "[Alliance] Can not kick superior");
  }

  function checkCanReject(bytes32 playerEntity) internal view {
    uint8 role = PlayerAlliance.getRole(playerEntity);
    require(role > 0 && role <= uint8(EAllianceRole.CanKick), "[Alliance] Does not have permission to reject");
  }

  /**
   * @dev Checks if the player can invite another player to the alliance or accept a join request.
   * @param playerEntity The entity ID of the player.
   * @param target The entity ID of the request target.
   */
  function checkCanInviteOrAcceptJoinRequest(bytes32 playerEntity, bytes32 target) internal view {
    uint8 role = PlayerAlliance.getRole(playerEntity);
    require(
      role > 0 && role <= uint8(EAllianceRole.CanInvite),
      "[Alliance] Does not have permission to invite players"
    );
    require(
      PlayerAlliance.getAlliance(target) != PlayerAlliance.getAlliance(playerEntity),
      "[Alliance] Player is already part of the alliance"
    );
  }

  /**
   * @dev Checks if the player can revoke the invite to another player or reject a join request.
   * @param inviter The entity ID of the inviter.
   * @param invitee The entity ID of the invitee.
   */
  function checkCanRevokeInvite(bytes32 inviter, bytes32 invitee) internal view {
    uint8 role = PlayerAlliance.getRole(inviter);
    require(
      (role > 0 && role <= uint8(EAllianceRole.CanKick)) ||
        AllianceInvitation.getInviter(invitee, PlayerAlliance.getAlliance(inviter)) == inviter,
      "[Alliance] Does not have permission to revoke invite"
    );
  }

  function checkCanCreateAlliance(bytes32 playerEntity) internal view {
    require(PlayerAlliance.getAlliance(playerEntity) == 0, "[Alliance] Player is already part of an alliance");
  }

  function checkCanLeaveAlliance(bytes32 playerEntity) internal view {
    require(PlayerAlliance.getRole(playerEntity) != uint8(EAllianceRole.Owner), "[Alliance] Owner can not leave");
  }

  /**
   * @dev try to join an alliance
   * @param player The entity ID of the player.
   * @param allianceEntity the entity ID of the alliance.
   */
  function join(bytes32 player, bytes32 allianceEntity) internal {
    checkNotMemberOfAnyAlliance(player);
    checkAllianceMaxJoinLimit(allianceEntity);
    checkCanNewPlayerJoinAlliance(player, allianceEntity);
    PlayerAlliance.set(player, allianceEntity, uint8(EAllianceRole.Member));
    AllianceInvitation.deleteRecord(player, allianceEntity);
    uint256 playerScore = Score.get(player);
    Alliance.setScore(allianceEntity, Alliance.getScore(allianceEntity) + playerScore);
    AllianceMembersSet.add(allianceEntity, player);
  }

  /**
   * @dev create an alliance
   * @param player The entity ID of the player.
   * @param name The name of the alliance.
   * @param allianceInviteMode The mode of the alliance invite
   */
  function create(
    bytes32 player,
    bytes32 name,
    EAllianceInviteMode allianceInviteMode
  ) internal returns (bytes32 allianceEntity) {
    checkNotMemberOfAnyAlliance(player);

    allianceEntity = LibEncode.getHash(AllianceKey, player);
    PlayerAlliance.set(player, allianceEntity, uint8(EAllianceRole.Owner));
    Alliance.set(allianceEntity, AllianceData(name, 0, uint8(allianceInviteMode)));
    uint256 playerScore = Score.get(player);
    Alliance.setScore(allianceEntity, Alliance.getScore(allianceEntity) + playerScore);
    Score.set(allianceEntity, Score.get(allianceEntity) + playerScore);
    AllianceMembersSet.add(allianceEntity, player);
  }

  /**
   * @dev leave an alliance
   * @param player The entity ID of the player.
   */
  function leave(bytes32 player) internal {
    bytes32 allianceEntity = PlayerAlliance.getAlliance(player);
    if (allianceEntity == 0) return;
    AllianceMembersSet.remove(allianceEntity, player);
    if (PlayerAlliance.getRole(player) == uint8(EAllianceRole.Owner)) {
      if (AllianceMembersSet.length(allianceEntity) == 0) {
        Alliance.deleteRecord(allianceEntity);
        PlayerAlliance.deleteRecord(player);
        return;
      }
      bytes32[] memory members = AllianceMembersSet.getMembers(allianceEntity);
      bytes32 nextInLine = members[0];
      for (uint256 i = 0; i < members.length; i++) {
        if (PlayerAlliance.getRole(members[i]) < PlayerAlliance.getRole(nextInLine)) {
          nextInLine = members[i];
        }
      }
      PlayerAlliance.set(nextInLine, allianceEntity, uint8(EAllianceRole.Owner));
    }
    PlayerAlliance.deleteRecord(player);
    uint256 playerScore = Score.get(player);
    Alliance.setScore(allianceEntity, Alliance.getScore(allianceEntity) - playerScore);
  }

  /**
   * @dev invite a player to an alliance
   * @param player The entity ID of the player.
   * @param target The entity ID of the target.
   */
  function invite(bytes32 player, bytes32 target) internal {
    checkCanInviteOrAcceptJoinRequest(player, target);
    bytes32 allianceEntity = PlayerAlliance.getAlliance(player);
    AllianceInvitation.set(target, allianceEntity, player, block.timestamp);
  }

  /**
   * @dev revoke an invite to an alliance
   * @param inviter The entity ID of the player who created invite.
   * @param invitee the entity id of the player invited to join
   */
  function revokeInvite(bytes32 inviter, bytes32 invitee) internal {
    checkCanRevokeInvite(inviter, invitee);
    bytes32 allianceEntity = PlayerAlliance.getAlliance(inviter);
    AllianceInvitation.deleteRecord(invitee, allianceEntity);
  }

  /**
   * @dev kick a player from an alliance
   * @param player The entity ID of the player kicking.
   * @param target the entity id of the player to kick
   */
  function kick(bytes32 player, bytes32 target) internal {
    checkCanKick(player, target);
    bytes32 allianceEntity = PlayerAlliance.getAlliance(player);
    PlayerAlliance.deleteRecord(target);
    uint256 playerScore = Score.get(target);
    Alliance.setScore(allianceEntity, Alliance.getScore(allianceEntity) - playerScore);
    AllianceMembersSet.remove(allianceEntity, target);
  }

  /**
   * @dev grant a role to a player within an alliance
   * @param granter The entity ID of the player granting the role.
   * @param target The entity ID of the player being granted the role.
   * @param role The role to grant.
   */
  function grantRole(bytes32 granter, bytes32 target, EAllianceRole role) internal {
    checkCanGrantRole(granter, target, role);
    bytes32 allianceEntity = PlayerAlliance.getAlliance(granter);
    PlayerAlliance.set(target, allianceEntity, uint8(role));

    //if the role being granted is Owner, then the granter loses that role and becomes CanGrantRole
    if (role == EAllianceRole.Owner) {
      PlayerAlliance.set(granter, allianceEntity, uint8(EAllianceRole.CanGrantRole));
    }
  }

  /**
   * @dev grant a role to a player within an alliance
   * @param player The entity ID of the player who is requesting to join.
   * @param alliance The entity ID of the alliance the player has requested to join.
   */
  function requestToJoin(bytes32 player, bytes32 alliance) internal {
    AllianceJoinRequest.set(player, alliance, block.timestamp);
  }

  /**
   * @dev reject a player's request to join an alliance
   * @param player The entity ID of the player who is rejecting the request to join.
   * @param rejectee The entity ID of the the player who has requested to join.
   */
  function rejectRequestToJoin(bytes32 player, bytes32 rejectee) internal {
    checkCanReject(player);
    bytes32 allianceEntity = PlayerAlliance.getAlliance(player);
    AllianceJoinRequest.deleteRecord(rejectee, allianceEntity);
  }

  /**
   * @dev reject a player's request to join an alliance
   * @param player The entity ID of the player who is accepting the request to join.
   * @param accepted The entity ID of the the player who has requested to join.
   */
  function acceptRequestToJoin(bytes32 player, bytes32 accepted) internal {
    checkCanInviteOrAcceptJoinRequest(player, accepted);
    bytes32 allianceEntity = PlayerAlliance.getAlliance(player);
    checkAllianceMaxJoinLimit(allianceEntity);
    PlayerAlliance.set(accepted, allianceEntity, uint8(EAllianceRole.Member));

    uint256 playerScore = Score.get(accepted);
    Alliance.setScore(allianceEntity, Alliance.getScore(allianceEntity) + playerScore);

    AllianceJoinRequest.deleteRecord(accepted, allianceEntity);
    AllianceMembersSet.add(allianceEntity, accepted);
  }
}
