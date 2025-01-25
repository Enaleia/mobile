import { ACTION_COLORS, ACTION_ICONS, ACTION_SLUGS } from "@/constants/action";
import { ImageSourcePropType } from "react-native";

export interface Action {
  id: number;
  name: ActionTitle;
  description: string;
  color: string;
  icon: ImageSourcePropType;
  slug: string;
  category: string;
}

// TODO: Re-assess if this is needed
export type ActionStatus = "Pending" | "In Progress" | "Complete";

export type ActionTitle =
  | "Fishing for litter"
  | "Manufacturing"
  | "Prevention"
  | "Shredding"
  | "Sorting"
  | "Washing"
  | "Batch"
  | "Beach cleanup"
  | "Ad-hoc"
  | "Pelletizing";

export type ActionCategory =
  | "Collecting"
  | "Transporting"
  | "Recycling"
  | "Manufacturing";

export type ActionIcon = Record<ActionTitle, ImageSourcePropType>;
export type ActionColor = Record<ActionTitle, string>;
export type ActionCategories = Record<ActionCategory, ActionTitle[]>;
export type ActionSlug = Record<ActionTitle, string>;
export type ActionIds = {
  [K in keyof typeof ACTION_COLORS]: number;
};

export type GroupedActions = {
  [category: string]: Action[];
};

export const processActions = (actions: any[] | undefined): Action[] => {
  if (!actions || !Array.isArray(actions)) {
    return [];
  }

  return actions
    .map((action) => {
      // Ensure action_name is a valid ActionTitle
      const name = action.action_name as ActionTitle;
      if (!Object.keys(ACTION_SLUGS).includes(name)) {
        console.warn(`Invalid action name: ${name}`);
        return null;
      }

      return {
        id: action.action_id,
        name,
        description: action.action_description,
        color: ACTION_COLORS[name],
        icon: ACTION_ICONS[name],
        slug: ACTION_SLUGS[name],
        category: action.action_group,
      };
    })
    .filter((action): action is Action => action !== null);
};

export const groupActionsByCategory = (
  actions: Action[] | undefined
): GroupedActions => {
  if (!actions || !Array.isArray(actions)) {
    return {};
  }

  const groupedActions: GroupedActions = {};

  for (const action of actions) {
    if (!groupedActions[action.category]) {
      groupedActions[action.category] = [];
    }
    groupedActions[action.category].push(action);
  }

  return groupedActions;
};

export interface TypeInformationProps {
  icons: ImageSourcePropType[];
  title:
    | "Collection"
    | "Collection Batch"
    | "Sorting"
    | "Manufacturing"
    | "Washing"
    | "Shredding"
    | "Pelletizing";
  description: string;
  incomingInstructions: string[];
  outgoingInstructions: string[];
  important: string;
  notes: string;
  isVisible: boolean;
  onClose: () => void;
}

const commonIncomingCopy = [
  "Tap 'Add Incoming' button.",
  "Select the material type for the manufacturing process.",
  "Scan the QR code of the incoming material batch or manually enter the code.",
  "Enter the weight of the material.",
  "Repeat for each additional incoming materials, if necessary.",
];

const commonOutgoingCopy = [
  "Affix a new QR code sticker to the sorted outgoing material.",
  "Tap 'Add Outgoing' button.",
  "Select the material for the sorted outgoing batch.",
  "Scan the newly affixed QR code or manually enter the code.",
  "Enter the weight of the sorted outgoing material.",
  "Repeat for each outgoing materials.",
];

type ModalData = Pick<
  TypeInformationProps,
  | "title"
  | "description"
  | "incomingInstructions"
  | "outgoingInstructions"
  | "important"
  | "notes"
  | "icons"
>;

const modalData: ModalData[] = [
  {
    title: "Collection",
    description:
      "A collection batch is used for shipping a container of collections.",
    incomingInstructions: commonIncomingCopy.slice(0, -1),
    outgoingInstructions: [],
    important:
      "A collection attestation should not be used to enter multiple collections from multiple collectors at once. It is used for a single or multiple collections from the same collector at any given time.",
    notes: "",
    icons: [
      ACTION_ICONS["Fishing for litter"],
      ACTION_ICONS["Prevention"],
      ACTION_ICONS["Beach cleanup"],
      ACTION_ICONS["Ad-hoc"],
    ],
  },
  {
    title: "Collection Batch",
    icons: [ACTION_ICONS["Batch"]],
    description:
      "A collection batch is used for shipping a container of collections.",
    incomingInstructions: [],
    outgoingInstructions: commonOutgoingCopy.slice(0, -1),
    important:
      "If the collection batch materials span multiple containers, multiple outgoing materials should be added in the same attestation rather than creating a new attestation for each, but each container requires its own new unique QR sticker.",
    notes: "",
  },
  {
    title: "Sorting",
    icons: [ACTION_ICONS["Sorting"]],
    description:
      "A sorting attestation typically involves one incoming material and multiple outgoing materials, although multiple incoming materials can be entered/processed at the same time for operational efficiency.",
    incomingInstructions: commonIncomingCopy,
    outgoingInstructions: commonOutgoingCopy,
    important:
      "If your sorted outgoing material requires multiple bags or containers, please add one outgoing entry for each.",
    notes:
      "Example: After sorting, there are enough HDPE to fill 2 bags, each bag will have its own unique QR code sticker and each will also have its individual outgoing entry in the attestation.",
  },
  {
    title: "Shredding",
    icons: [ACTION_ICONS["Shredding"]],
    description:
      "A shredding attestation generally involves one incoming material and one outgoing material, but multiple incoming and outgoing materials can be entered/processed at the same time for operational efficiency.",
    incomingInstructions: commonIncomingCopy,
    outgoingInstructions: commonOutgoingCopy,
    important:
      "If your shredding process has multiple incoming bags/containers, each should have its own individual incoming entry. \n\n If the shredding process produces enough materials to fill multiple bags/containers, each should have its own unique QR sticker as well as outgoing entry.",
    notes:
      "Example: After shredding, there are enough HDPE to fill 2 bags, each bag will have its own unique QR code sticker and each will also have its individual outgoing entry in the attestation.",
  },
  {
    title: "Washing",
    icons: [ACTION_ICONS["Washing"]],
    description:
      "A washing attestation typically involves one incoming material and one outgoing material, but multiple incoming and outgoing materials can be entered/processed at the same time for operational efficiency.",
    incomingInstructions: commonIncomingCopy,
    outgoingInstructions: commonOutgoingCopy,
    important:
      "If your washing process has multiple incoming bags/containers, each should have its own individual incoming entry. \n\n If the washing process produces enough materials to fill multiple bags/containers, each should have its own unique QR sticker as well as outgoing entry.",
    notes:
      "Example: After washing, there are enough HDPE to fill 2 bags, each bag will have its own unique QR code sticker and each will also have its individual outgoing entry in the attestation.",
  },
  {
    title: "Pelletizing",
    icons: [ACTION_ICONS["Pelletizing"]],
    description:
      "A pelletizing attestation typically involves multiple incoming materials and multiple outgoing materials.",
    incomingInstructions: commonIncomingCopy,
    outgoingInstructions: commonOutgoingCopy.slice(0, -1),
    important:
      "If your pelletizing process has multiple incoming bags/containers, each should have its own individual incoming entry. \n\n If the pelletizing process produces enough materials to fill multiple bags/containers, each should have its own unique QR sticker as well as outgoing entry.",
    notes:
      "Example: After pelletizing, there are enough HDPE to fill 2 bags, each bag will have its own unique QR code sticker and each will also have its individual outgoing entry in the attestation.",
  },
  {
    title: "Manufacturing",
    icons: [ACTION_ICONS["Manufacturing"]],
    description:
      "A manufacturing attestation possibly involves multiple incoming materials and batch information for the manufactured products.",
    incomingInstructions: commonIncomingCopy,
    outgoingInstructions: [
      "Select the manufactured product.",
      "Enter the batch quantity.",
      "Enter the weight per item.",
    ],
    important:
      "If your manufacturing process has multiple incoming bags/containers, each should have its own individual incoming entry.",
    notes:
      "Weight per item is the weight of a single item in the manufactured batch, it represents the average weight of each individual item in the batch.",
  },
];

export const typeModalMap: Record<ActionTitle, ModalData> = {
  "Fishing for litter": modalData[0],
  Prevention: modalData[0],
  "Beach cleanup": modalData[0],
  "Ad-hoc": modalData[0],
  Batch: modalData[1],
  Sorting: modalData[2],
  Shredding: modalData[3],
  Washing: modalData[4],
  Pelletizing: modalData[5],
  Manufacturing: modalData[6],
};
