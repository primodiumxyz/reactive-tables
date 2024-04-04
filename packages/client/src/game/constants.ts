import { EResource } from "contracts/config/enums";
import { find } from "lodash";
import { parseEther } from "viem";
import AsteroidTiledMap from "./maps/asteroid_0.7.json";
import { EntityType } from "../util/constants";
export const ASSET_PACK = "/assets/pack.json";

export const minEth = parseEther("0.0049");
export const RENDER_INTERVAL = 10;
export const ANIMATION_INTERVAL = 200;
export const KEY = "MAIN";

export enum Scenes {
  Root = "ROOT",
  Asteroid = "MAIN",
  Starmap = "STARMAP",
  UI = "UI",
}

export enum Assets {
  SpriteAtlas = "sprite-atlas",
  ResourceTileset = "resource",
  AudioAtlas = "audio-atlas",
}

export enum Tilesets {
  Resource = "resource",
  BoundsOuterBorder = "bounds-outerborder",
  BoundsInnerBorder = "bounds-innerborder",
  BoundsNonBuildable = "bounds-nonbuildable",
}

export enum Tilemaps {
  AsteroidMicro = "asteroid-micro",
  AsteroidSmall = "asteroid-small",
  AsteroidMedium = "asteroid-medium",
  AsteroidLarge = "asteroid-large",
}

export enum DepthLayers {
  Rock = 100,
  Resources = 200,
  Tile = 300,
  Building = 400,
  Path = 500,
  Marker = 600,
}

export enum TerrainTilekeys {
  Air,
  Alluvium,
  Bedrock,
  Biofilm,
  Regolith,
  Sandstone,
  Water,
}

export enum ResourceTilekeys {
  Copper = 1,
  Iron,
  Lithium,
  Sulfur,
  Titanium,
  Kimberlite,
  Iridium,
  Platinum,
}

const FogTilekeysGID =
  find(AsteroidTiledMap.tilesets, {
    name: "fog",
  })?.firstgid ?? 0;

export enum FogTilekeys {
  Empty = FogTilekeysGID,
  BottomRight = FogTilekeysGID + 10,
  OuterBottomRight = FogTilekeysGID + 15,
  TopLeft = FogTilekeysGID + 2,
  OuterTopLeft = FogTilekeysGID + 17,
  TopRight = FogTilekeysGID + 3,
  OuterTopRight = FogTilekeysGID + 1,
  Top = FogTilekeysGID + 14,
  OuterTop = FogTilekeysGID + 16,
  Left = FogTilekeysGID + 8,
  OuterLeft = FogTilekeysGID + 6,
  Right = FogTilekeysGID + 6,
  OuterRight = FogTilekeysGID + 8,
  BottomLeft = FogTilekeysGID + 9,
  OuterBottomLeft = FogTilekeysGID + 13,
  Bottom = FogTilekeysGID + 16,
  OuterBottom = FogTilekeysGID + 14,
  Base = FogTilekeysGID + 7,
}

export const TileKeys = { ...TerrainTilekeys, ...ResourceTilekeys };

export enum TileAnimationKeys {
  Water = "Water",
}

export enum SpriteKeys {
  //BUILDINGS
  Mainbase1 = "sprites/mainbase/level1/Main_Base_LVL1_1.png",
  Mainbase2 = "sprites/mainbase/level2/Main_Base_LVL2_1.png",
  Mainbase3 = "sprites/mainbase/level3/Main_Base_LVL3_1.png",
  Mainbase4 = "sprites/mainbase/level4/Main_Base_LVL4_1.png",
  Mainbase5 = "sprites/mainbase/level5/Main_Base_LVL5_1.png",
  Mainbase6 = "sprites/mainbase/level6/Main_Base_LVL6_1.png",
  Mainbase7 = "sprites/mainbase/level7/Main_Base_LVL7_1.png",
  Mainbase8 = "sprites/mainbase/level8/Main_Base_LVL8_1.png",

  IronMine1 = "sprites/miners/ironmine/level1/Miner_Iron_LVL1_1.png",
  IronMine2 = "sprites/miners/ironmine/level2/Miner_Iron_LVL2_1.png",
  IronMine3 = "sprites/miners/ironmine/level3/Miner_Iron_LVL3_1.png",

  CopperMine1 = "sprites/miners/coppermine/level1/Miner_Copper_LVL1_1.png",
  CopperMine2 = "sprites/miners/coppermine/level2/Miner_Copper_LVL2_1.png",
  CopperMine3 = "sprites/miners/coppermine/level3/Miner_Copper_LVL3_1.png",

  LithiumMine1 = "sprites/miners/lithiummine/Miner_Lithium_LVL1_1.png",

  IridiumMine1 = "sprites/miners/iridiummine/level1/Miner_Iridium_LVL1_1.png",
  IridiumMine2 = "sprites/miners/iridiummine/level2/Miner_Iridium_LVL2_1.png",
  IridiumMine3 = "sprites/miners/iridiummine/level3/Miner_Iridium_LVL3_1.png",

  TitaniumMine1 = "sprites/miners/titaniummine/level1/Miner_Titanium_LVL1_1.png",
  TitaniumMine2 = "sprites/miners/titaniummine/level2/Miner_Titanium_LVL2_1.png",
  TitaniumMine3 = "sprites/miners/titaniummine/level3/Miner_Titanium_LVL3_1.png",

  PlatinumMine1 = "sprites/miners/platinummine/level1/Miner_Platinum_LVL1_1.png",
  PlatinumMine2 = "sprites/miners/platinummine/level2/Miner_Platinum_LVL2_1.png",
  PlatinumMine3 = "sprites/miners/platinummine/level3/Miner_Platinum_LVL3_1.png",

  KimberliteMine1 = "sprites/miners/kimberlitemine/level1/Miner_Kimberlite_LVL1_1.png",
  KimberliteMine2 = "sprites/miners/kimberlitemine/level2/Miner_Kimberlite_LVL2_1.png",
  KimberliteMine3 = "sprites/miners/kimberlitemine/level3/Miner_Kimberlite_LVL3_1.png",

  StorageUnit1 = "sprites/storage-facility/level1/Storage_Facility_LVL1.png",
  StorageUnit2 = "sprites/storage-facility/level2/Storage_Facility_LVL2.png",
  StorageUnit3 = "sprites/storage-facility/level3/Storage_Facility_LVL3_1.png",

  IronPlateFactory1 = "sprites/plating-factory/level1/Plating_Factory_LVL1_1.png",
  IronPlateFactory2 = "sprites/plating-factory/level1/Plating_Factory_LVL1_2.png",

  AlloyFactory1 = "sprites/alloy-factory/level1/Alloy_Factory1.png",
  AlloyFactory2 = "sprites/alloy-factory/level2/Alloy_Factory_LVL2_1.png",
  AlloyFactory3 = "sprites/alloy-factory/level3/Alloy_Factory_LVL3_1.png",

  SolarPanel1 = "sprites/solar-panels/level1/Solar_Panels_LVL1_1.png",
  SolarPanel2 = "sprites/solar-panels/level2/Solar_Panels_LVL2_1.png",

  PhotovoltaicCellFactory1 = "sprites/photovoltaic-cell-factory/level1/Photovoltaic_Factory_LVL1_1.png",
  PhotovoltaicCellFactory2 = "sprites/photovoltaic-cell-factory/level2/Photovoltaic_Factory_LVL2_1.png",

  StarmapperStation1 = "sprites/starmapper-station/level1/Starmapper1.png",
  StarmapperStation2 = "sprites/starmapper-station/level2/Starmapper_LVL2_1.png",
  StarmapperStation3 = "sprites/starmapper-station/level3/Starmapper_LVL3_1.png",

  Hangar1 = "sprites/hangar/level1/Hangar1.png",

  Garage1 = "sprites/garage/level1/Garage_LVL1_1.png",
  Garage2 = "sprites/garage/level2/Garage_LVL2_1.png",

  Workshop1 = "sprites/workshop/level1/Workshop_LVL1_1.png",
  Workshop2 = "sprites/workshop/level2/Workshop_LVL2_1.png",
  Workshop3 = "sprites/workshop/level3/Workshop_LVL3_1.png",

  Market1 = "sprites/marketplace/level1/Marketplace_LVL1_1.png",

  DroneFactory1 = "sprites/drone-factory/normal/Drone_Factory1.png",

  SAMLauncher1 = "sprites/sam_launcher/level1/SAM_Launcher_LVL1_1.png",
  SAMLauncher2 = "sprites/sam_launcher/level2/SAM_Launcher_LVL2_1.png",
  SAMLauncher3 = "sprites/sam_launcher/level3/SAM_Launcher_LVL3_1.png",

  ShieldGenerator1 = "sprites/shield-generator/level1/Shield_Generator_LVL1_1.png",
  ShieldGenerator2 = "sprites/shield-generator/level2/Shield_Generator_LVL2_1.png",
  ShieldGenerator3 = "sprites/shield-generator/level3/Shield_Generator_LVL3_1.png",

  Vault1 = "sprites/vault/level1/Vault_LVL1_1.png",
  Vault2 = "sprites/vault/level2/Vault_LVL2_1.png",
  Vault3 = "sprites/vault/level3/Vault_LVL3_1.png",

  Shipyard1 = "sprites/shipyard/level1/Shipyard_LVL1_1.png",
  DroidBase = "sprites/droidbase/Droid_Base1.png",

  //ASTEROIDS
  Asteroid1 = "sprites/spacerocks/asteroids/asteroid1.png",
  Asteroid2 = "sprites/spacerocks/asteroids/asteroid2.png",
  Asteroid3 = "sprites/spacerocks/asteroids/asteroid3.png",
  Asteroid4 = "sprites/spacerocks/asteroids/asteroid4.png",
  Asteroid5 = "sprites/spacerocks/asteroids/asteroid5.png",

  //PIRATE ASTEROIDS
  PirateAsteroid1 = "sprites/spacerocks/pirate_asteroids/Pirate_Asteroid1.png",
  PirateAsteroid2 = "sprites/spacerocks/pirate_asteroids/Pirate_Asteroid2.png",

  //MOTHERLODES
  MotherlodeIridiumSmall = "sprites/spacerocks/motherlodes/motherlode_iridium_small.png",
  MotherlodeIridiumMedium = "sprites/spacerocks/motherlodes/motherlode_iridium_medium.png",
  MotherlodeIridiumLarge = "sprites/spacerocks/motherlodes/motherlode_iridium_large.png",

  MotherlodeTitaniumSmall = "sprites/spacerocks/motherlodes/motherlode_titanium_small.png",
  MotherlodeTitaniumMedium = "sprites/spacerocks/motherlodes/motherlode_titanium_medium.png",
  MotherlodeTitaniumLarge = "sprites/spacerocks/motherlodes/motherlode_titanium_large.png",

  MotherlodeKimberliteSmall = "sprites/spacerocks/motherlodes/motherlode_kimberlite_small.png",
  MotherlodeKimberliteMedium = "sprites/spacerocks/motherlodes/motherlode_kimberlite_medium.png",
  MotherlodeKimberliteLarge = "sprites/spacerocks/motherlodes/motherlode_kimberlite_large.png",

  MotherlodePlatinumSmall = "sprites/spacerocks/motherlodes/motherlode_platinum_small.png",
  MotherlodePlatinumMedium = "sprites/spacerocks/motherlodes/motherlode_platinum_medium.png",
  MotherlodePlatinumLarge = "sprites/spacerocks/motherlodes/motherlode_platinum_large.png",

  //ASTEROID BORDERS
  AsteroidPlayer = "sprites/spacerocks/borders/Border_Player.png",
  AsteroidEnemy = "sprites/spacerocks/borders/Border_Enemy.png",
  AsteroidPirate = "sprites/spacerocks/borders/Border_Pirate.png",
  AsteroidAlliance = "sprites/spacerocks/borders/Border_Alliance.png",

  MotherlodePlayerSmall = "sprites/spacerocks/borders/Border_Player_Motherlode1.png",
  MotherlodePlayerMedium = "sprites/spacerocks/borders/Border_Player_Motherlode2.png",
  MotherlodePlayerLarge = "sprites/spacerocks/borders/Border_Player_Motherlode3.png",

  MotherlodeNeutralSmall = "sprites/spacerocks/borders/Border_Enemy_Neutral1.png",
  MotherlodeNeutralMedium = "sprites/spacerocks/borders/Border_Enemy_Neutral2.png",
  MotherlodeNeutralLarge = "sprites/spacerocks/borders/Border_Enemy_Neutral3.png",

  MotherlodeEnemySmall = "sprites/spacerocks/borders/Border_Enemy_Motherlode1.png",
  MotherlodeEnemyMedium = "sprites/spacerocks/borders/Border_Enemy_Motherlode2.png",
  MotherlodeEnemyLarge = "sprites/spacerocks/borders/Border_Enemy_Motherlode3.png",

  MotherlodeAllianceSmall = "sprites/spacerocks/borders/Border_Alliance_Motherlode1.png",
  MotherlodeAllianceMedium = "sprites/spacerocks/borders/Border_Alliance_Motherlode2.png",
  MotherlodeAllianceLarge = "sprites/spacerocks/borders/Border_Alliance_Motherlode3.png",

  //CONSTRUCTION
  Construction1x1 = "sprites/construction/1x1.png",
  Construction2x2 = "sprites/construction/2x2.png",
  Construction3x3 = "sprites/construction/3x3.png",
  Construction4x4 = "sprites/construction/4x4.png",
  Construction2x3 = "sprites/construction/2x3.png",
  Construction4x6 = "sprites/construction/4x6.png",

  // Resource Icons
  GracePeriod = "sprites/icons/grace.png",
  Iron = "sprites/icons/resources/iron_resource.png",
  Copper = "sprites/icons/resources/copper_resource.png",
  Lithium = "sprites/icons/resources/lithium_resource.png",
  IronPlate = "sprites/icons/resources/ironplate.png",
  PVCell = "sprites/icons/resources/photovoltaiccell_resource.png",
  Alloy = "sprites/icons/resources/alloy_resource.png",

  // Unit Icons
  StingerDrone = "sprites/icons/units/stingerdrone.png",
  AegisDrone = "sprites/icons/units/aegisdrone.png",
  AnvilDrone = "sprites/icons/units/anvildrone.png",
  HammerDrone = "sprites/icons/units/hammerdrone.png",
  TridentMarine = "sprites/icons/units/trident_marine.png",
  MinutemanMarine = "sprites/icons/units/minutemen_marine.png",
  LightningCraft = "sprites/icons/units/lightningcraft.png",
}

export enum AnimationKeys {
  Mainbase1 = "mainbase/level1",
  Mainbase2 = "mainbase/level2",
  Mainbase3 = "mainbase/level3",
  Mainbase4 = "mainbase/level4",
  Mainbase5 = "mainbase/level5",
  Mainbase6 = "mainbase/level6",
  Mainbase7 = "mainbase/level7",
  Mainbase8 = "mainbase/level8",

  IronMine1 = "ironmine/level1",
  IronMine2 = "ironmine/level2",
  IronMine3 = "ironmine/level3",

  CopperMine1 = "coppermine/level1",
  CopperMine2 = "coppermine/level2",
  CopperMine3 = "coppermine/level3",

  LithiumMine1 = "lithiummine/level1",

  IridiumMine1 = "iridiummine/level1",
  IridiumMine2 = "iridiummine/level2",
  IridiumMine3 = "iridiummine/level3",

  TitaniumMine1 = "titaniummine/level1",
  TitaniumMine2 = "titaniummine/level2",
  TitaniumMine3 = "titaniummine/level3",

  PlatinumMine1 = "platinummine/level1",
  PlatinumMine2 = "platinummine/level2",
  PlatinumMine3 = "platinummine/level3",

  KimberliteMine1 = "kimberlitemine/level1",
  KimberliteMine2 = "kimberlitemine/level2",
  KimberliteMine3 = "kimberlitemine/level3",

  StorageUnit3 = "storageunit/level3",

  IronPlateFactory1 = "ironplatefactory/level1",
  IronPlateFactory2 = "ironplatefactory/level2",

  AlloyFactory1 = "alloyfactory/level1",
  AlloyFactory2 = "alloyfactory/level2",
  AlloyFactory3 = "alloyfactory/level3",

  PhotovoltaicCellFactory1 = "pvcfactory/level1",
  PhotovoltaicCellFactory2 = "pvcfactory/level2",

  SolarPanel1 = "solarpanel/level1",
  SolarPanel2 = "solarpanel/level2",

  StarmapperStation1 = "starmapperstation/level1",
  StarmapperStation2 = "starmapperstation/level2",
  StarmapperStation3 = "starmapperstation/level3",

  Hangar1 = "hangar/level1",

  Garage1 = "garage/level1",
  Garage2 = "garage/level2",

  Workshop1 = "workshop/level1",
  Workshop2 = "workshop/level2",
  Workshop3 = "workshop/level3",

  DroneFactory1 = "dronefactory/level1",

  SAMLauncher1 = "samlauncher/level1",
  SAMLauncher2 = "samlauncher/level2",
  SAMLauncher3 = "samlauncher/level3",

  ShieldGenerator1 = "shieldgenerator/level1",
  ShieldGenerator2 = "shieldgenerator/level2",
  ShieldGenerator3 = "shieldgenerator/level3",

  Vault1 = "vault/level1",
  Vault2 = "vault/level2",
  Vault3 = "vault/level3",

  Market1 = "marketplace/level1",

  Shipyard1 = "shipyard/level1",

  DroidBase = "droidbase/level1",

  //DECORATIONS
  Drone = "decorations/drone",
}

export enum AudioKeys {
  Background = "background",
  Background2 = "background2",
  Bleep = "Bleep_01",
  Bleep2 = "Bleep_02",
  Bleep3 = "Bleep_03",
  Bleep4 = "Bleep_04",
  Bleep5 = "Bleep_05",
  Bleep6 = "Bleep_06",
  Bleep7 = "Bleep_07",
  Click = "Click_01",
  Click2 = "Click_02",
  Click3 = "Click_03",
  Click4 = "Click_04",
  Sequence = "Sequence_01",
  Sequence2 = "Sequence_02",
  Sequence3 = "Sequence_03",
  Sequence4 = "Sequence_04",
  Sequence5 = "Sequence_05",
  Sequence6 = "Sequence_06",
  Sequence7 = "Sequence_07",
  Execute = "Execute_01",
  Execute2 = "Execute_02",
  DataPoint = "Data_Point_01",
  DataPoint2 = "Data_Point_02",
  Confirm = "Confirm_01",
  Confirm2 = "Confirm_02",
  Confirm3 = "Confirm_03",
  Confirm4 = "Confirm_04",
  Confirm5 = "Confirm_05",
  Confirm6 = "Confirm_06",
  Confirm7 = "Confirm_07",
  Complete = "Complete_01",
  Complete2 = "Complete_02",
}

export const ResourceToTilesetKey: { [key: number]: ResourceTilekeys } = {
  [EResource.Iron]: ResourceTilekeys.Iron,
  [EResource.Copper]: ResourceTilekeys.Copper,
  [EResource.Lithium]: ResourceTilekeys.Lithium,
  [EResource.Kimberlite]: ResourceTilekeys.Kimberlite,
  [EResource.Iridium]: ResourceTilekeys.Iridium,
  [EResource.Platinum]: ResourceTilekeys.Platinum,
  [EResource.Titanium]: ResourceTilekeys.Titanium,
};

export const EntityToResourceSpriteKey = {
  [EntityType.Iron]: SpriteKeys.Iron,
  [EntityType.Copper]: SpriteKeys.Copper,
  [EntityType.Lithium]: SpriteKeys.Lithium,
  [EntityType.IronPlate]: SpriteKeys.IronPlate,
  [EntityType.PVCell]: SpriteKeys.PVCell,
  [EntityType.Alloy]: SpriteKeys.Alloy,
};

export const EntityToUnitSpriteKey = {
  [EntityType.AegisDrone]: SpriteKeys.AegisDrone,
  [EntityType.AnvilDrone]: SpriteKeys.AnvilDrone,
  [EntityType.HammerDrone]: SpriteKeys.HammerDrone,
  [EntityType.StingerDrone]: SpriteKeys.StingerDrone,
  [EntityType.TridentMarine]: SpriteKeys.TridentMarine,
  [EntityType.LightningCraft]: SpriteKeys.LightningCraft,
  [EntityType.MinutemanMarine]: SpriteKeys.MinutemanMarine,
};

export const EntitytoBuildingSpriteKey = {
  [EntityType.MainBase]: [
    SpriteKeys.Mainbase1,
    SpriteKeys.Mainbase2,
    SpriteKeys.Mainbase3,
    SpriteKeys.Mainbase4,
    SpriteKeys.Mainbase5,
    SpriteKeys.Mainbase6,
    SpriteKeys.Mainbase7,
    SpriteKeys.Mainbase8,
  ],

  [EntityType.IronMine]: [SpriteKeys.IronMine1, SpriteKeys.IronMine2, SpriteKeys.IronMine3],

  [EntityType.CopperMine]: [SpriteKeys.CopperMine1, SpriteKeys.CopperMine2, SpriteKeys.CopperMine3],

  [EntityType.LithiumMine]: [SpriteKeys.LithiumMine1],

  [EntityType.KimberliteMine]: [SpriteKeys.KimberliteMine1, SpriteKeys.KimberliteMine2, SpriteKeys.KimberliteMine3],
  [EntityType.IridiumMine]: [SpriteKeys.IridiumMine1, SpriteKeys.IridiumMine2, SpriteKeys.IridiumMine3],
  [EntityType.TitaniumMine]: [SpriteKeys.TitaniumMine1, SpriteKeys.TitaniumMine2, SpriteKeys.TitaniumMine3],
  [EntityType.PlatinumMine]: [SpriteKeys.PlatinumMine1, SpriteKeys.PlatinumMine2, SpriteKeys.PlatinumMine3],

  [EntityType.StorageUnit]: [SpriteKeys.StorageUnit1, SpriteKeys.StorageUnit2, SpriteKeys.StorageUnit3],

  [EntityType.IronPlateFactory]: [SpriteKeys.IronPlateFactory1, SpriteKeys.IronPlateFactory2],

  [EntityType.AlloyFactory]: [SpriteKeys.AlloyFactory1, SpriteKeys.AlloyFactory2, SpriteKeys.AlloyFactory3],

  [EntityType.PVCellFactory]: [SpriteKeys.PhotovoltaicCellFactory1, SpriteKeys.PhotovoltaicCellFactory2],

  [EntityType.SolarPanel]: [SpriteKeys.SolarPanel1, SpriteKeys.SolarPanel2],

  [EntityType.StarmapperStation]: [
    SpriteKeys.StarmapperStation1,
    SpriteKeys.StarmapperStation2,
    SpriteKeys.StarmapperStation3,
  ],

  [EntityType.Hangar]: [SpriteKeys.Hangar1],

  [EntityType.Garage]: [SpriteKeys.Garage1, SpriteKeys.Garage2],

  [EntityType.Workshop]: [SpriteKeys.Workshop1, SpriteKeys.Workshop2, SpriteKeys.Workshop3],

  [EntityType.SAMLauncher]: [SpriteKeys.SAMLauncher1, SpriteKeys.SAMLauncher2, SpriteKeys.SAMLauncher3],

  [EntityType.DroneFactory]: [SpriteKeys.DroneFactory1],

  [EntityType.ShieldGenerator]: [SpriteKeys.ShieldGenerator1, SpriteKeys.ShieldGenerator2, SpriteKeys.ShieldGenerator3],
  [EntityType.Vault]: [SpriteKeys.Vault1, SpriteKeys.Vault2, SpriteKeys.Vault3],
  [EntityType.Market]: [SpriteKeys.Market1],
  [EntityType.Shipyard]: [SpriteKeys.Shipyard1],
  [EntityType.DroidBase]: [SpriteKeys.DroidBase],

  //STARMAP
  [EntityType.Asteroid]: [
    SpriteKeys.Asteroid1,
    SpriteKeys.Asteroid2,
    SpriteKeys.Asteroid3,
    SpriteKeys.Asteroid4,
    SpriteKeys.Asteroid5,
  ],
};

// Array index corresponds to lvl
export const EntityIDtoAnimationKey = {
  [EntityType.MainBase]: [
    AnimationKeys.Mainbase1,
    AnimationKeys.Mainbase2,
    AnimationKeys.Mainbase3,
    AnimationKeys.Mainbase4,
    AnimationKeys.Mainbase5,
    AnimationKeys.Mainbase6,
    AnimationKeys.Mainbase7,
    AnimationKeys.Mainbase8,
  ],

  [EntityType.IronMine]: [AnimationKeys.IronMine1, AnimationKeys.IronMine2, AnimationKeys.IronMine3],
  [EntityType.CopperMine]: [AnimationKeys.CopperMine1, AnimationKeys.CopperMine2, AnimationKeys.CopperMine3],
  [EntityType.LithiumMine]: [AnimationKeys.LithiumMine1],

  [EntityType.KimberliteMine]: [
    AnimationKeys.KimberliteMine1,
    AnimationKeys.KimberliteMine2,
    AnimationKeys.KimberliteMine3,
  ],
  [EntityType.IridiumMine]: [AnimationKeys.IridiumMine1, AnimationKeys.IridiumMine2, AnimationKeys.IridiumMine3],
  [EntityType.PlatinumMine]: [AnimationKeys.PlatinumMine1, AnimationKeys.PlatinumMine2, AnimationKeys.PlatinumMine3],
  [EntityType.TitaniumMine]: [AnimationKeys.TitaniumMine1, AnimationKeys.TitaniumMine2, AnimationKeys.TitaniumMine3],

  [EntityType.StorageUnit]: [undefined, undefined, AnimationKeys.StorageUnit3],

  [EntityType.IronPlateFactory]: [AnimationKeys.IronPlateFactory1, AnimationKeys.IronPlateFactory2],

  [EntityType.AlloyFactory]: [AnimationKeys.AlloyFactory1, AnimationKeys.AlloyFactory2, AnimationKeys.AlloyFactory3],

  [EntityType.PVCellFactory]: [AnimationKeys.PhotovoltaicCellFactory1, AnimationKeys.PhotovoltaicCellFactory2],

  [EntityType.SolarPanel]: [AnimationKeys.SolarPanel1, AnimationKeys.SolarPanel2],

  [EntityType.StarmapperStation]: [
    AnimationKeys.StarmapperStation1,
    AnimationKeys.StarmapperStation2,
    AnimationKeys.StarmapperStation3,
  ],

  [EntityType.Hangar]: [AnimationKeys.Hangar1],

  [EntityType.Garage]: [AnimationKeys.Garage1, AnimationKeys.Garage2],

  [EntityType.Workshop]: [AnimationKeys.Workshop1, AnimationKeys.Workshop2, AnimationKeys.Workshop3],

  [EntityType.DroneFactory]: [AnimationKeys.DroneFactory1],

  [EntityType.SAMLauncher]: [AnimationKeys.SAMLauncher1, AnimationKeys.SAMLauncher2, AnimationKeys.SAMLauncher3],

  [EntityType.ShieldGenerator]: [
    AnimationKeys.ShieldGenerator1,
    AnimationKeys.ShieldGenerator2,
    AnimationKeys.ShieldGenerator3,
  ],

  [EntityType.Vault]: [AnimationKeys.Vault1, AnimationKeys.Vault2, AnimationKeys.Vault3],
  [EntityType.Market]: [AnimationKeys.Market1],
  [EntityType.Shipyard]: [AnimationKeys.Shipyard1],
  [EntityType.DroidBase]: [AnimationKeys.DroidBase],
};

export enum KeybindActions {
  Up,
  Down,
  Left,
  Right,
  Center,
  SpacerockMenu,
  Base,
  Hotbar1,
  Hotbar2,
  Hotbar3,
  Hotbar4,
  Hotbar5,
  Hotbar6,
  Hotbar7,
  Hotbar8,
  Hotbar9,
  Hotbar0,
  NextHotbar,
  PrevHotbar,

  Marker1,
  Marker2,
  Marker3,
  Marker4,

  ZoomIn,
  ZoomOut,
  RightClick,
  LeftClick,

  Account,
  Blueprints,
  Objectives,
  Resources,
  Units,
  Asteroids,
  Fleets,
  Chat,
  HideAll,

  Esc,
  Modifier,
  Map,
  Console,

  NULL,
}

export const KeyNames: { [key: string]: string } = {
  ["ONE"]: "1",
  ["TWO"]: "2",
  ["THREE"]: "3",
  ["FOUR"]: "4",
  ["FIVE"]: "5",
  ["SIX"]: "6",
  ["SEVEN"]: "7",
  ["EIGHT"]: "8",
  ["NINE"]: "9",
  ["ZERO"]: "0",
  ["OPEN_BRACKET"]: "[",
  ["CLOSE_BRACKET"]: "]",
  ["SEMICOLON"]: ";",
};

export const MaxLevelToTilemap: Record<number, Tilemaps> = {
  1: Tilemaps.AsteroidMicro,
  3: Tilemaps.AsteroidSmall,
  5: Tilemaps.AsteroidMedium,
  8: Tilemaps.AsteroidLarge,
};
