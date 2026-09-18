import { CableType } from './types';

export const CABLE_CATALOG: CableType[] = [
  {
    id: 'ethernet-copper',
    name: 'Copper Ethernet',
    shortName: 'Copper',
    medium: 'copper',
    description: 'RJ45 Ethernet patch cable (Cat5e/Cat6 class).',
    compatiblePairs: [['rj45', 'rj45']],
  },
  {
    id: 'sfp-dac',
    name: 'SFP/SFP+ DAC',
    shortName: 'DAC',
    medium: 'dac',
    description: 'Direct-attach copper cable for SFP/SFP+ cages.',
    compatiblePairs: [
      ['sfp', 'sfp'],
      ['sfp', 'sfp+'],
      ['sfp+', 'sfp'],
      ['sfp+', 'sfp+'],
    ],
  },
  {
    id: 'sfp-fiber',
    name: 'Fiber via SFP/SFP+',
    shortName: 'Fiber',
    medium: 'fiber',
    description: 'Fiber link using compatible SFP/SFP+ transceivers.',
    compatiblePairs: [
      ['sfp', 'sfp'],
      ['sfp', 'sfp+'],
      ['sfp+', 'sfp'],
      ['sfp+', 'sfp+'],
    ],
  },
  {
    id: 'console',
    name: 'Console Cable',
    shortName: 'Console',
    medium: 'console',
    description: 'Management console cable.',
    compatiblePairs: [['console', 'console']],
  },
];
