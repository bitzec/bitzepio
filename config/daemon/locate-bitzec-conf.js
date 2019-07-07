// @flow

import path from 'path';
import os from 'os';

import { app } from '../electron'; // eslint-disable-line

export const locateBitzecConf = () => {
  if (os.platform() === 'darwin') {
    return path.join(app.getPath('appData'), 'Bitzec', 'bitzec.conf');
  }

  if (os.platform() === 'linux') {
    return path.join(app.getPath('home'), '.bitzec', 'bitzec.conf');
  }

  return path.join(app.getPath('appData'), 'Bitzec', 'bitzec.conf');
};
