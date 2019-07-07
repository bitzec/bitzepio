// @flow

import { isTestnet } from '../../config/is-testnet';

export const BITZEC_EXPLORER_BASE_URL = isTestnet()
  ? 'https://chain.so/tx/BZCTEST/'
  : 'http://http://35.242.189.203:3001/insight/tx/';
