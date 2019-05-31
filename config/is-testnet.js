// @flow

import electronStore from './electron-store';
import { BITZEC_NETWORK, MAINNET } from '../app/constants/bitzec-network';

export const isTestnet = () => electronStore.get(BITZEC_NETWORK) !== MAINNET;
