// @flow

import fs from 'fs';

import { locateBitzecConf } from './locate-bitzec-conf';
import { filterObjectNullKeys } from '../../app/utils/filter-object-null-keys';

type BitzecConfFile = {
  testnet: ?string,
  regtest: ?string,
  proxy: ?string,
  bind: ?string,
  whitebind: ?string,
  addnode: ?string,
  connect: ?string,
  listen: ?string,
  maxconnections: ?string,
  server: ?string,
  rpcbind: ?string,
  rpcuser: ?string,
  rpcpassword: ?string,
  rpcclienttimeout: ?string,
  rpcallowip: ?string,
  rpcport: ?string,
  rpcconnect: ?string,
  sendfreetransactions: ?string,
  txconfirmtarget: ?string,
  gen: ?string,
  genproclimit: ?string,
  keypool: ?string,
  paytxfee: ?string,
  datadir?: string,
  conf?: string,
};

// eslint-disable-next-line
export const parseBitzecConf = (customDir: ?string): Promise<BitzecConfFile> => new Promise((resolve, reject) => {
  fs.readFile(customDir || locateBitzecConf(), (err, file) => {
    if (err) return reject(err);

    const fileString = file.toString();

    /* eslint-disable no-unused-vars */
    // $FlowFixMe
    const payload: BitzecConfFile = filterObjectNullKeys(
      fileString.split('\n').reduce((acc, cur) => {
        if (!cur) return acc;

        const line = cur.trim();

        if (line.startsWith('#')) return acc;

        const [key, value] = cur.split('=');
        return { ...acc, [key.trim().toLowerCase()]: value.trim() };
      }, {}),
    );

    resolve(payload);
  });
});

/* eslint-disable-next-line max-len */
export const generateArgsFromConf = (obj: BitzecdConfFile): Array<string> => Object.keys(obj).reduce((acc, key) => {
  // We can omit the credentials for the command line
  if (key === 'rpcuser' || key === 'rpcpassword') return acc;

  return acc.concat(`-${key}=${String(obj[key])}`);
}, []);

export const parseCmdArgs = (
  cmd: string,
): { user: string, password: string, port: string, isTestnet: boolean } => {
  const splitArgs = cmd.split(' ');

  const rpcUserInArgs = splitArgs.find(x => x.startsWith('-rpcuser'));
  const rpcPasswordInArgs = splitArgs.find(x => x.startsWith('-rpcpassword'));
  const rpcPortInArgs = splitArgs.find(x => x.startsWith('-rpcport'));
  const testnetInArgs = splitArgs.find(x => x.startsWith('-testnet'));

  const rpcUser = rpcUserInArgs ? rpcUserInArgs.replace('-rpcuser=', '') : '';
  const rpcPassword = rpcPasswordInArgs ? rpcPasswordInArgs.replace('-rpcpassword=', '') : '';
  const rpcPort = rpcPortInArgs ? rpcPortInArgs.replace('-rpcport=', '') : '';
console.log(`rpcport ${rpcPort}`);
  return {
    user: rpcUser, password: rpcPassword, port: rpcPort, isTestnet: Boolean(testnetInArgs),
  };
};
