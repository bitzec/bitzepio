// @flow

import cp from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import processExists from 'process-exists';
/* eslint-disable import/no-extraneous-dependencies */
import isDev from 'electron-is-dev';
import type { ChildProcess } from 'child_process';
import eres from 'eres';
import uuid from 'uuid/v4';
import findProcess from 'find-process';

/* eslint-disable-next-line import/named */
import { mainWindow } from '../electron';
import waitForDaemonClose from './wait-for-daemon-close';
import getBinariesPath from './get-binaries-path';
import getOsFolder from './get-os-folder';
import getDaemonName from './get-daemon-name';
import fetchParams from './run-fetch-params';
import { locateBitzecConf } from './locate-bitzec-conf';
import { log } from './logger';
import store from '../electron-store';
import { parseBitzecConf, parseCmdArgs, generateArgsFromConf } from './parse-bitzec-conf';
import { isTestnet } from '../is-testnet';
import {
  EMBEDDED_DAEMON,
  BITZEC_NETWORK,
  TESTNET,
  MAINNET,
} from '../../app/constants/bitzec-network';

const getDaemonOptions = ({
  username, password, useDefaultBitzecConf, optionsFromBitzecConf,
}) => {
  /*
    -showmetrics
        Show metrics on stdout
    -metricsui
        Set to 1 for a persistent metrics screen, 0 for sequential metrics
        output
    -metricsrefreshtime
        Number of seconds between metrics refreshes
  */

  const defaultOptions = [
    '-server=1',
    '-showmetrics',
    '--metricsui=0',
    '-metricsrefreshtime=1',
    `-rpcuser=${username}`,
    `-rpcpassword=${password}`,
    ...(isTestnet() ? ['-testnet', '-addnode=testnet.z.cash'] : ['-addnode=35.242.189.203']),
    // Overwriting the settings with values taken from "bitzec.conf"
    ...optionsFromBitzecConf,
  ];

  if (useDefaultBitzecConf) defaultOptions.push(`-conf=${locateBitzecConf()}`);

  return Array.from(new Set([...defaultOptions, ...optionsFromBitzecConf]));
};

let resolved = false;

const BITZECD_PROCESS_NAME = getDaemonName();

let isWindowOpened = false;

const sendToRenderer = (event: string, message: Object, shouldLog: boolean = true) => {
  if (shouldLog) {
    log(message);
  }

  if (isWindowOpened) {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(event, message);
    }
  } else {
    const interval = setInterval(() => {
      if (isWindowOpened) {
        mainWindow.webContents.send(event, message);
        clearInterval(interval);
      }
    }, 1000);
  }
};

// eslint-disable-next-line
const runDaemon: () => Promise<?ChildProcess> = () => new Promise(async (resolve, reject) => {
  mainWindow.webContents.on('dom-ready', () => {
    isWindowOpened = true;
  });

  const processName = path.join(getBinariesPath(), getOsFolder(), BITZECD_PROCESS_NAME);
  const isRelaunch = Boolean(process.argv.find(arg => arg === '--relaunch'));

  if (!mainWindow.isDestroyed()) mainWindow.webContents.send('bitzecd-params-download', 'Fetching params...');

  sendToRenderer('bitzec-daemon-status', {
    error: false,
    status:
        'Downloading network params, this may take some time depending on your connection speed',
  });

  const [err] = await eres(fetchParams());

  if (err) {
    sendToRenderer('bitzec-daemon-status', {
      error: true,
      status: `Error while fetching params: ${err.message}`,
    });

    return reject(new Error(err));
  }

  sendToRenderer('bitzec-daemon-status', {
    error: false,
    status: 'Bitzecpio Starting',
  });

  // In case of --relaunch on argv, we need wait to close the old bitzec daemon
  // a workaround is use a interval to check if there is a old process running
  if (isRelaunch) {
    await waitForDaemonClose(BITZECD_PROCESS_NAME);
  }

  const [, isRunning] = await eres(processExists(BITZECD_PROCESS_NAME));

  // This will parse and save rpcuser and rpcpassword in the store
  let [, optionsFromBitzecConf] = await eres(parseBitzecConf());

  // if the user has a custom datadir and doesn't have a bitzec.conf in that folder,
  // we need to use the default bitzec.conf
  let useDefaultBitzecConf = false;

  if (optionsFromBitzecConf.datadir) {
    const hasDatadirConf = fs.existsSync(path.join(optionsFromBitzecConf.datadir, 'bitzec.conf'));

    if (hasDatadirConf) {
      optionsFromBitzecConf = await parseBitzecConf(
        path.join(String(optionsFromBitzecConf.datadir), 'bitzec.conf'),
      );
    } else {
      useDefaultBitzecConf = true;
    }
  }

  if (optionsFromBitzecConf.rpcuser) store.set('rpcuser', optionsFromBitzecConf.rpcuser);
  if (optionsFromBitzecConf.rpcpassword) store.set('rpcpassword', optionsFromBitzecConf.rpcpassword);
  if (optionsFromBitzecConf.rpcport) store.set('rpcport', optionsFromBitzecConf.rpcport);

  if (isRunning) {
    log('Already is running!');

    store.set(EMBEDDED_DAEMON, false);
    // We need grab the rpcuser and rpcpassword from either process args or bitzec.conf

    // Command line args override bitzec.conf
    const [{ cmd }] = await findProcess('name', BITZECD_PROCESS_NAME);
    const {
      user, password, port, isTestnet: isTestnetFromCmd,
    } = parseCmdArgs(cmd);

    store.set(
      BITZEC_NETWORK,
      isTestnetFromCmd || optionsFromBitzecConf.testnet === '1' ? TESTNET : MAINNET,
    );

    if (user) store.set('rpcuser', user);
    if (password) store.set('rpcpassword', password);
    if (!port) {
      store.set('rpcport', 8732);
    } else {
      store.set('rpcport', port);
    }

    return resolve();
  }

  store.set(EMBEDDED_DAEMON, true);

  if (!isRelaunch) {
    store.set(BITZEC_NETWORK, optionsFromBitzecConf.testnet === '1' ? TESTNET : MAINNET);
  }

  if (!optionsFromBitzecConf.rpcuser) store.set('rpcuser', uuid());
  if (!optionsFromBitzecConf.rpcpassword) store.set('rpcpassword', uuid());
  if (!optionsFromBitzecConf.rpcport) store.set('rpcport', '8732');

  const rpcCredentials = {
    username: store.get('rpcuser'),
    password: store.get('rpcpassword'),
  };

  if (isDev) log('Rpc Credentials', rpcCredentials);

  const childProcess = cp.spawn(
    processName,
    getDaemonOptions({
      ...rpcCredentials,
      useDefaultBitzecConf,
      optionsFromBitzecConf: generateArgsFromConf(optionsFromBitzecConf),
    }),
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  childProcess.stdout.on('data', (data) => {
    sendToRenderer('bitzecd-log', data.toString(), false);
    if (!resolved) {
      resolve(childProcess);
      resolved = true;
    }
  });

  childProcess.stderr.on('data', (data) => {
    log(data.toString());
    reject(new Error(data.toString()));
  });

  childProcess.on('error', reject);

  if (os.platform() === 'win32') {
    resolved = true;
    resolve(childProcess);
  }
});

// eslint-disable-next-line
export default runDaemon;
