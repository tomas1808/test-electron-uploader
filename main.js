const { app, BrowserWindow, Menu, dialog } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

// Logging setup (optional)
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Define the menu (optional)
let template = [];
if (process.platform === 'darwin') {
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  });
}

// Open a window that displays the version (optional)
let win;

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}

function createDefaultWindow() {
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  return win;
}

// AutoUpdater event listeners
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');

  // Notify the user about the available update
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. Would you like to restart and install now?',
    buttons: ['Restart and Install', 'Later']
  }).then(result => {
    if (result.response === 0) { // 'Restart and Install' button pressed
      autoUpdater.quitAndInstall(false, true); // Install and restart
    }
  });
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message += ' - Downloaded ' + progressObj.percent + '%';
  log_message += ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded.');
});

app.on('ready', function () {
  // Create the Menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createDefaultWindow();

  // Check for updates immediately when the app is ready
  autoUpdater.checkForUpdatesAndNotify();

  // Set an interval to check for updates every 10 minutes (600,000 ms)
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 60000); // 60000 ms = 1 minute
});


app.on('window-all-closed', () => {
  // Install update on quit without restarting automatically
  if (win) {
    autoUpdater.quitAndInstall(false, false); // Silent install without restart
  }
  app.quit();
});
