// @flow
import os from 'os';
import path from 'path';
import electron from 'electron'; // eslint-disable-line

export const getBitzecFolder = () => {
  const { app } = electron;

  if (os.platform() === 'darwin') {
    return path.join(app.getPath('appData'), 'Bitzec');
  }

  if (os.platform() === 'linux') {
    return path.join(app.getPath('home'), '.bitzec');
  }

  return path.join(app.getPath('appData'), 'Bitzec');
};
