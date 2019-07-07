// @flow

import '@babel/polyfill';
import dotenv from 'dotenv';

import path from 'path';

/* eslint-disable import/no-extraneous-dependencies */
import { app, Menu, BrowserWindow, typeof BrowserWindow as BrowserWindowType } from 'electron';
import { autoUpdater } from 'electron-updater';
import isDev from 'electron-is-dev';
import { registerDebugShortcut } from '../utils/debug-shortcut';
import runDaemon from './daemon/bitzecd-child-process';
import { log as bitzecLog, cleanLogs } from './daemon/logger';
import getBzcPrice from '../services/bzc-price';
import store from './electron-store';
import { handleDeeplink } from './handle-deeplink';
import rpc from '../services/api';

dotenv.config();

let mainWindow: BrowserWindowType;
let updateAvailable: boolean = false;
let bitzecDaemon;

const showStatus = (text) => {
  if (text === 'Update downloaded') updateAvailable = true;

  if (mainWindow) {
    mainWindow.webContents.send('update', {
      updateAvailable,
      updateInfo: text,
    });
  }
};

const createWindow = () => {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('checking-for-update', () => showStatus('Checking for update'));
  autoUpdater.on('update-available', () => showStatus('Update available'));
  autoUpdater.on('update-not-available', () => showStatus('No updates available'));
  autoUpdater.on('error', err => showStatus(`Error while updating: ${err}`));

  autoUpdater.on('download-progress', progress => showStatus(
    /* eslint-disable-next-line max-len */
    `Download speed: ${progress.bytesPerSecond} - Downloaded ${progress.percent}% (${
      progress.transferred
    }/${progress.total})`,
  ));

  autoUpdater.on('update-downloaded', () => {
    updateAvailable = true;
    showStatus('Update downloaded');
  });

  mainWindow = new BrowserWindow({
    minWidth: 980,
    minHeight: 700,
    width: 980,
    height: 700,
    transparent: false,
    frame: true,
    resizable: true,
    webPreferences: {
      devTools: true,
      // devTools: false,
      webSecurity: true,
    },
  });

  getBzcPrice().then(({ USD }) => store.set('BZC_DOLLAR_PRICE', String(USD)));

  mainWindow.setVisibleOnAllWorkspaces(true);
  registerDebugShortcut(app, mainWindow);

  mainWindow.loadURL(
    isDev ? 'http://localhost:8080/' : `file://${path.join(__dirname, '../build/index.html')}`,
  );

  exports.app = app;
  exports.mainWindow = mainWindow;
};

app.setAsDefaultProtocolClient('bitzec');

const instanceLock = app.requestSingleInstanceLock();
if (instanceLock) {
  app.on('second-instance', (event: Object, argv: string[]) => {
    handleDeeplink({
      app,
      mainWindow,
      argv,
      listenOpenUrl: false,
    });

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.focus();
    }
  });
} else {
  app.quit();
}

handleDeeplink({ app, mainWindow });

/* eslint-disable-next-line consistent-return */
app.on('ready', async () => {
  createWindow();

  console.log('[Process Argv]', process.argv); // eslint-disable-line

  // Reset old logs on startup
  cleanLogs();

  if (process.env.NODE_ENV === 'test') {
    bitzecLog('Not running daemon, please run the mock API');
    return;
  }

  // Create the Application's main menu
  const template = [{
    label: 'Application',
    submenu: [
      { label: 'About Application', selector: 'orderFrontStandardAboutPanel:' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', click() { app.quit(); } },
    ],
  }, {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
    ],
  },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  runDaemon()
    .then((proc) => {
      if (proc) {
        bitzecLog(`Bitzec Daemon running. PID: ${proc.pid}`);
        bitzecDaemon = proc;
      }
    })
    .catch(bitzecLog);
});
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', () => {
  if (bitzecDaemon) {
    bitzecLog('Graceful shutdown Bitzec Daemon, this may take a few seconds.');
    rpc.stop();
    bitzecDaemon.kill('SIGINT');
  }
});
