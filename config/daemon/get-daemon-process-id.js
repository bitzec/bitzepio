// @flow
import fs from 'fs';
import path from 'path';
import { getBitzecFolder } from './get-bitzec-folder';

const BITZEC_PID_FILE = 'bitzecd.pid';

export const getDaemonProcessId = (bitzecPath?: string) => {
  try {
    const myPath = bitzecPath || getBitzecFolder();
    const buffer = fs.readFileSync(path.join(myPath, BITZEC_PID_FILE));
    const pid = Number(buffer.toString().trim());
    return pid;
  } catch (err) {
    return null;
  }
};
