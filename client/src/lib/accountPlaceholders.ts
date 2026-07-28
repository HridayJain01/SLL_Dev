/**
 * Sample content for the two My Account cards that have no backend yet
 * (Figma node 380:230 — "Children's Profiles" and "Saved Addresses").
 *
 * TODO: replace with real data once the API exposes child profiles and saved
 * addresses (e.g. `GET /users/me/children`, `GET /users/me/addresses`). Until
 * then these seed the page's local state so the layout matches the design.
 */

export type ChildProfile = {
  id: string;
  name: string;
  ageMin: number;
  ageMax: number;
};

export type SavedAddress = {
  id: string;
  label: string;
  line: string;
  isDefault: boolean;
};

export const SAMPLE_CHILD_PROFILES: ChildProfile[] = [
  { id: 'child-1', name: 'Aarav', ageMin: 5, ageMax: 7 },
  { id: 'child-2', name: 'Meher', ageMin: 3, ageMax: 5 },
];

export const SAMPLE_ADDRESSES: SavedAddress[] = [
  {
    id: 'address-1',
    label: 'Home',
    line: '402, Sunrise Apartments, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
    isDefault: true,
  },
  {
    id: 'address-2',
    label: "Grandma's House",
    line: '14 Palm Grove Society, Andheri East, Mumbai, Maharashtra 400069',
    isDefault: false,
  },
];
