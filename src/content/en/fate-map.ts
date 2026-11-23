import { buildFateCopy, type FateData } from '../fate-copy';
import { FATE_KO } from '../ko/fate-map';
import data from './fate-map.data.json';

export const FATE_EN = buildFateCopy(data as FateData, FATE_KO);
