// @flow

import path from 'path';
import os from 'os';

import { app } from '../electron'; // eslint-disable-line

export const locateCommerciumConf = () => {
  if (os.platform() === 'darwin') {
    return path.join(app.getPath('appData'), 'Bitzec', 'commercium.conf');
  }

  if (os.platform() === 'linux') {
    return path.join(app.getPath('home'), '.bitzec', 'bitzec.conf');
  }

  return path.join(app.getPath('appData'), 'Bitzec', 'bitzec.conf');
};
