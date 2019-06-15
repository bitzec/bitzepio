// @flow

import { isTestnet } from '../../config/is-testnet';

export const BITBZC_EXPLORER_BASE_URL = isTestnet()
  ? 'https://chain.so/tx/BZCTEST/'
  : 'https://zcha.in/transactions/';
