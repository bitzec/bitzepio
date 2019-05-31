// @flow

import { isTestnet } from '../../config/is-testnet';

export const BITZEC_EXPLORER_BASE_URL = isTestnet()
  ? 'https://chain.so/tx/ZECTEST/'
  : 'https://zcha.in/transactions/';
