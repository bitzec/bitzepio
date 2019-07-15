// @flow
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import eres from 'eres';

import { getBitzecFolder } from './get-zcash-folder';

const BITZEC_LOCK_FILE = '.lock';

export const checkLockFile = async (zcashPath?: string) => {
  try {
    const myPath = bitzecPath || getBitzecFolder();
    const [cannotAccess] = await eres(promisify(fs.access)(path.join(myPath, ZCASH_LOCK_FILE)));
    return !cannotAccess;
  } catch (err) {
    return false;
  }
};
