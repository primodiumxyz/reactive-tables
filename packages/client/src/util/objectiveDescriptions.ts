import { Entity } from "@latticexyz/recs";
import { EObjectives } from "contracts/config/enums";
import { ObjectiveEnumLookup } from "./constants";

export const getObjectiveDescription = (objective: Entity) => {
  const objectiveEnum = ObjectiveEnumLookup[objective];
  if (!objectiveEnum) return "";

  return ObjectiveDescriptions.get(objectiveEnum);
};

export const ObjectiveDescriptions = new Map<EObjectives, string>([
  //landscape blocks
  [
    EObjectives.BuildIronMine,
    "Select the iron mine on the building menu below and place it on the iron ore tile. Iron mines produce iron.",
  ],
  [
    EObjectives.BuildCopperMine,
    "Select the copper mine on the building menu below and place it on the copper ore tile. Copper mines produce copper.",
  ],
  [
    EObjectives.BuildLithiumMine,
    "Select the lithium mine on the building menu below and place it on the lithium ore tile. Lithium mines produce lithium.",
  ],
  [
    EObjectives.BuildIronPlateFactory,
    "Select the plating factory on the building menu and place it on an empty tile. It produces iron plates by consuming iron production.",
  ],
  [
    EObjectives.BuildPVCellFactory,
    "Select the photovoltaic cell factory on the building menu and place it on an empty tile. It produces photovoltaic cells by consuming copper and lithium production.",
  ],
  [
    EObjectives.BuildGarage,
    "Select the garage from the building menu and place it on an empty tile. Garages provide housing for units. ",
  ],
  [
    EObjectives.BuildWorkshop,
    "Select the workshop from the building menu and place it on an empty tile. Workshops train basic units, like marines.",
  ],
  [
    EObjectives.BuildSolarPanel,
    "Select the solar panel from the building menu and place it on an empty tile. Solar panels provide electricity, which is used for advanced buildings.",
  ],
  [
    EObjectives.BuildDroneFactory,
    "Select the drone factory from the building menu and place it on an empty tile. Drone factories train drones, which travel faster and are stronger.",
  ],
  [
    EObjectives.BuildHangar,
    "Select the hangar from the building menu and place it on an empty tile. Hangars provide more housing than garages for units.",
  ],
  [
    EObjectives.TrainMinutemanMarine1,
    "Select the workshop you placed on the map to train Minuteman marines. Minutemen are basic defensive marines.",
  ],
  [
    EObjectives.TrainMinutemanMarine2,
    "Select the workshop you placed on the map to train Minuteman marines. Minutemen are basic defensive marines.",
  ],
  [
    EObjectives.TrainMinutemanMarine3,
    "Select the workshop you placed on the map to train Minuteman marines. Minutemen are basic defensive marines.",
  ],

  [
    EObjectives.TrainTridentMarine1,
    "Select the workshop you placed on the map to train Trident marines. Trident marines are basic offensive units.",
  ],
  [
    EObjectives.TrainTridentMarine2,
    "Select the workshop you placed on the map to train Trident marines. Trident marines are basic offensive units.",
  ],
  [
    EObjectives.TrainTridentMarine3,
    "Select the workshop you placed on the map to train Trident marines. Trident marines are basic offensive units.",
  ],
  [
    EObjectives.TrainAnvilDrone1,
    "Select the drone factory you placed on the map to train anvil drones. Anvil drones are basic defensive drones.",
  ],
  [
    EObjectives.TrainAnvilDrone2,
    "Select the drone factory you placed on the map to train anvil drones. Anvil drones are basic defensive drones.",
  ],
  [
    EObjectives.TrainAnvilDrone3,
    "Select the drone factory you placed on the map to train anvil drones. Anvil drones are basic defensive drones.",
  ],
  [
    EObjectives.DefeatPirateBase1,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase2,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase3,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase4,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase5,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase6,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase7,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase8,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.DefeatPirateBase9,
    "Select the starmap on the top of your screen, then choose the red tinted pirate asteroid and send units to attack and raid.",
  ],
  [
    EObjectives.ExpandBase1,
    "Select your main base and click on Expand base to expand your buildable zone and uncover more resource ores.",
  ],
  [
    EObjectives.ExpandBase2,
    "Select your main base and click on Expand base to expand your buildable zone and uncover more resource ores.",
  ],
  [
    EObjectives.ExpandBase3,
    "Select your main base and click on Expand base to expand your buildable zone and uncover more resource ores.",
  ],
  [
    EObjectives.ExpandBase4,
    "Select your main base and click on Expand base to expand your buildable zone and uncover more resource ores.",
  ],
  [
    EObjectives.ExpandBase5,
    "Select your main base and click on Expand base to expand your buildable zone and uncover more resource ores.",
  ],
  [
    EObjectives.ExpandBase6,
    "Select your main base and click on Expand base to expand your buildable zone and uncover more resource ores.",
  ],
  [
    EObjectives.TrainHammerDrone1,
    "Select the drone factory you placed on the map to train hammer drones. Hammer drones are used for attacking.",
  ],
  [
    EObjectives.TrainHammerDrone2,
    "Select the drone factory you placed on the map to train hammer drones. Hammer drones are used for attacking.",
  ],
  [
    EObjectives.TrainHammerDrone3,
    "Select the drone factory you placed on the map to train hammer drones. Hammer drones are used for attacking.",
  ],

  [
    EObjectives.TrainAegisDrone2,
    "Select the drone factory you placed on the map to train aegis drones. Aegis drones are strong defensive units, but take up more housing.",
  ],
  [
    EObjectives.TrainAegisDrone2,
    "Select the drone factory you placed on the map to train aegis drones. Aegis drones are strong defensive units, but take up more housing.",
  ],
  [
    EObjectives.TrainAegisDrone3,
    "Select the drone factory you placed on the map to train aegis drones. Aegis drones are strong defensive units, but take up more housing.",
  ],

  [
    EObjectives.TrainStingerDrone1,
    "Select the drone factory you placed on the map to train aegis drones. Stinger drones are strong and fast offensive units, but take up more housing.",
  ],
  [
    EObjectives.TrainStingerDrone2,
    "Select the drone factory you placed on the map to train aegis drones. Stinger drones are strong and fast offensive units, but take up more housing.",
  ],
  [
    EObjectives.TrainStingerDrone3,
    "Select the drone factory you placed on the map to train aegis drones. Stinger drones are strong and fast offensive units, but take up more housing.",
  ],

  [EObjectives.UpgradeMainBase, "Upgrade your main base by clicking on the upgrade button in your main base."],

  [
    EObjectives.BuildStarmapper,
    "Construct a starmapper station. A starmapper station increases the number of fleets you can send at a time.",
  ],

  [
    EObjectives.BuildSAMLauncher,
    "Construct a SAM site. SAM sites protect you from enemy attacks and raids by providing a base level of defense.",
  ],
  [EObjectives.BuildVault, "Build a vault. Vaults protect your resources from being raided."],
  [
    EObjectives.BuildShieldGenerator,
    "Build a shield generator. Shield generators multiply your asteroid's defense numbers.",
  ],
]);
