import { InterfaceMedia } from '../device-registry';

export type CableMedium = 'copper' | 'dac' | 'fiber' | 'console';

export interface CableType {
  id: string;
  name: string;
  shortName: string;
  medium: CableMedium;
  description: string;
  compatiblePairs: Array<[InterfaceMedia, InterfaceMedia]>;
}
