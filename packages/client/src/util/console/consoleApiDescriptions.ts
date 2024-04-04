import config from "contracts/mud.config";

const tableParams: Record<string, string> = Object.entries(config.tables).reduce((acc, [tableName, data]) => {
  const formattedKeys = Object.entries(data.keySchema).map(([key, type]) => {
    return `${key}: ${type}`;
  }, "");
  const formattedValues = Object.entries(data.valueSchema).map(([key, type]) => {
    return `${key}: ${type}`;
  }, "");
  acc[tableName] = `Keys: {${formattedKeys.join(", ")}} Values: {${formattedValues.join(", ")}}`;
  return acc;
}, {} as Record<string, string>);

const consoleApiDescriptions: Record<string, string> = {
  // top level
  priPlayerAccount: "Contains your account information.",
  priComponents: "All world data is stored in components.",
  priContractCalls: "Directly call world contract functions.",
  priUtils: "Utility functions.",
  priConstants: "Constants used in the game.",

  //components
  ...tableParams,
  get: "Get a value by entity, a hex string.",
  getWithKeys: "Get a component by raw keys. The keys should be in an object with the same keys as the component.",
  getAll: "Get all values of the component.",
  getAllWith: "Get all component entities that have the value passed in.",
  getAllWithout: "Get all component entities that do not have the value passed in.",
  has: "Check if an entity has a component.",
  hasWithKeys: "Check if an entity has a component with the given keys.",

  // Access control
  grantAccess: "Grants access to an authorized account.",
  revokeAccess: "Revokes previously granted authorized account.",
  revokeAllAccess: "Revokes all access from all authorized accounts.",

  // Delegation
  switchAuthorized: "Switches the authorization for this session.",

  // Alliance management
  createAlliance: "Creates a new alliance.",
  leaveAlliance: "Leaves the current alliance.",
  joinAlliance: "Joins an existing alliance.",
  declineInvite: "Declines an invitation to join an alliance.",
  requestToJoin: "Requests to join an alliance.",
  kickPlayer: "Removes a player from the alliance.",
  grantRole: "Grants a role within the alliance.",
  acceptJoinRequest: "Accepts a player's request to join the alliance.",
  rejectJoinRequest: "Rejects a player's request to join the alliance.",
  invite: "Invites a player to join the alliance.",

  // Building management
  buildBuilding: "Initiates the construction of a building.",

  // Military actions
  claimObjective: "Claims an objective.",
  claimUnits: "Claims units.",
  demolishBuilding: "Demolishes a building.",
  invade: "Initiates an invasion.",
  moveBuilding: "Moves a building to a new location.",
  raid: "Conducts a raid.",
  recallArrival: "Recalls arriving units.",
  recallStationedUnits: "Recalls units stationed elsewhere.",
  reinforce: "Sends reinforcements.",
  send: "Sends units or resources.",
  toggleBuilding: "Toggles a building's active state.",
  train: "Trains units.",
  upgradeBuilding: "Upgrades a building.",
  upgradeRange: "Upgrades the range of a building or unit.",
  upgradeUnit: "Upgrades a unit.",

  getAllianceName: "Gets the name of an alliance.",
  getAllianceNameFromPlayer: "Gets alliance name associated with a player.",

  calcDims: "Calculates building dimensions.",
  relCoordToAbs: "Converts relative coordinates to absolute.",
  getBuildingOrigin: "Gets the origin point of a building.",
  getBuildingDimensions: "Retrieves the dimensions of a building.",
  getBuildingName: "Gets the name of a building.",
  getBuildingImage: "Gets an image of a building.",
  getBuildingImageFromType: "Gets building image based on type.",
  getBuildingStorages: "Retrieves storage information of a building.",
  getBuildingLevelStorageUpgrades: "Gets storage upgrade info for a building level.",
  getBuildingInfo: "Provides detailed information about a building.",
  getBuildingAtCoord: "Finds a building at specified coordinates.",
  getBuildingsOfTypeInRange: "Finds buildings of a certain type within a range.",

  entityToColor: "Converts an entity to its representative color.",

  findEntriesWithPrefix: "Finds local storage entries with a specific prefix.",
  getPrivateKey: "Retrieves the private key from local storage.",

  entityToPlayerName: "Converts an entity to player name.",
  entityToRockName: "Converts an entity to rock name.",
  playerNameToEntity: "Converts player name to its corresponding entity.",
  rockNameToEntity: "Converts rock name to its corresponding entity.",

  getIsObjectiveAvailable: "Checks if an objective is available.",
  getCanClaimObjective: "Determines if an objective can be claimed.",

  outOfBounds: "Checks if a point is out of bounds.",
  getAsteroidBounds: "Gets the bounds of an asteroid.",
  getAsteroidMaxBounds: "Gets the maximum bounds of an asteroid.",

  // Recipe utilities
  getRecipe: "Retrieves a recipe.",
  getRecipeDifference: "Finds the difference between two recipes.",

  // Resource utilities
  getScale: "Gets the scale of a resource.",
  isUtility: "Determines if a resource is a utility.",
  getFullResourceCount: "Counts all resources.",
  getAsteroidResourceCount: "Counts resources on an asteroid.",
  getFullResourceCounts: "Counts all types of resources.",

  // Reward utility
  getRewards: "Retrieves rewards.",

  // Send utilities
  getMoveLength: "Calculates the length of a move.",
  getSlowestUnitSpeed: "Finds the speed of the slowest unit.",

  // Space rock utilities
  getSpaceRockImage: "Gets an image of a space rock.",
  getSpaceRockName: "Retrieves the name of a space rock.",
  getSpaceRockInfo: "Provides information about a space rock.",
  getRockRelationship: "Determines the relationship with a rock.",

  // Units utilities
  getUnitStats: "Retrieves statistics of a unit.",
  getUnitTrainingTime: "Calculates training time for a unit.",

  // Upgrade utility
  getUpgradeInfo: "Provides information about an upgrade.",

  // Vector utilities
  solSin: "Calculates sine using solar metrics.",
  solCos: "Calculates cosine using solar metrics.",
  solSinDegrees: "Calculates sine in degrees using solar metrics.",
  solCosDegrees: "Calculates cosine in degrees using solar metrics.",
  SPEED_SCALE: "Defines the scale factor for speed calculations.",
  RESOURCE_SCALE: "Sets the scale factor for resource-related computations.",
  MULTIPLIER_SCALE: "Determines the scale for multiplier values.",
  UNIT_SPEED_SCALE: "Specifies the scale factor for unit speed calculations.",

  EntityType: "Enumerates different types of entities in the system.",
  BlockIdToKey: "Maps block IDs to their corresponding key values.",

  MotherlodeSizeNames: "Contains names for different sizes of motherlodes.",
  MotherlodeTypeNames: "Lists names for various types of motherlodes.",

  ResourceStorages: "Defines storage capacities or parameters for different resources.",
  UtilityStorages: "Specifies storage information for utility items or resources.",
  MultiplierStorages: "Details storage capacities for multipliers.",

  BuildingEnumLookup: "Provides a lookup for building types using enumeration.",
  BuildingEntityLookup: "Maps building entities to their respective data or characteristics.",

  ResourceEntityLookup: "Associates resource entities with their specific attributes or details.",
  ResourceEnumLookup: "Provides a lookup for resource types using enumeration.",

  UnitEntityLookup: "Maps unit entities to their respective attributes or information.",
  UnitEnumLookup: "Offers a lookup for unit types through enumeration.",
};

export default consoleApiDescriptions;
