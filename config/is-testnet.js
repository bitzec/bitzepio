// @flow

import electronStore from './electron-store';
import { BITBZC_NETWORK, MAINNET } from '../app/constants/bitzec-network';

export const isTestnet = () => electronStore.get(BITBZC_NETWORK) !== MAINNET;
