// @flow

import path from 'path';
import os from 'os';

import { app } from '../electron'; // eslint-disable-line

export const locateCommerciumConf = () => {
  if (os.platform() === 'darwin') {
    return path.join(app.getPath('appData'), 'Bitzec', 'bitzec.conf');
  }

  if (os.platform() === 'linux') {
    return path.join(app.getPath('home'), '.bitzec', 'commercium.conf');
  }

  return path.join(app.getPath('appData'), 'Bitzec', 'bitzec.conf');
};
