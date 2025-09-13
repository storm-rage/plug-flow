import { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, session } from 'electron';
import path from 'path'; 
import fs from 'fs';
import { fileURLToPath } from 'url';

// const __dirname = path.dirname(new URL(import.meta.url).pathname);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray = null
export function createMainWindow() {
  const preloadPath = path.join(__dirname, '..', 'preload.js');
  console.log('Preload path:', preloadPath);

  let mainWindow = new BrowserWindow({
    width: 1300,
    minWidth: 1260,
    height: 900,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, '..','assets/favicon.ico'),
    webPreferences: {
      webSecurity: false,
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: true, // 保持启用上下文隔离
      preload: path.join(__dirname, '..', 'preload.js')
    },
    autoHideMenuBar: true,
    menu: null
  })
  const indexPath = path.join(__dirname, '..','..','dist','index.html')
  // const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log('Index path:', indexPath);
  console.log('File exists:', fs.existsSync(indexPath));
  // mainWindow.loadFile(indexPath)
  if (fs.existsSync(indexPath)) {
    mainWindow.loadURL(`file://${indexPath}`)
    // mainWindow.loadFile(indexPath)//生产环境
  } else {
    console.error('Index file not found');
    // 可以加载一个错误页面或显示错误信息
  }

  // mainWindow.loadURL(`file://${indexPath}`)//构建发布时用
  // mainWindow.loadURL('http://localhost:5173') // vite dev 默认端口

  ipcMain.handle('get-cookies', async (event, url) => {
    try {
      const cookies = await session.defaultSession.cookies.get({});
      return cookies;
    } catch (error) {
      console.error('获取 Cookie 错误:', error);
      return [];
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load: ${errorDescription}`);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
  });

  app.on('render-process-gone', (event, webContents, details) => {
    console.error('Renderer process gone:', details);
  });


    // 最小化到托盘
  // mainWindow.on('minimize', (event) => {
  //   event.preventDefault()
  //   mainWindow.hide()
  // })
  // // 关闭窗口时托盘保留
  // mainWindow.on('close', (event) => {
  //   if (!app.isQuiting) {
  //     event.preventDefault()
  //     mainWindow.hide()
  //   }
  //   return false
  // })

  // return mainWindow
  const window = BrowserWindow.getFocusedWindow();

  ipcMain.on('win-minimize',(event,data)=> { 
    if (window) {
        window.minimize();
        console.log('get minimize')
    }
  })
  ipcMain.on('win-maximize', (event, data) => {
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });
  ipcMain.on('win-close', (event, data) => {
    if (window) {
      window.close();
    }
  });
  ipcMain.on('closeWin', (event, data) => {
    mainWindow.webContents.send('closeWin', data);
  })
  ipcMain.on('node-click', (event, data) => {
    if (window) {
      window.webContents.send('node-click', data);
    }
  })
  ipcMain.on('query-keyword', (event, data) => {
    if (window) {
      window.webContents.send('query-keyword', data);
    }
  })
  ipcMain.on('clear-keyvalue', () => {
    if (window) {
      window.webContents.send('clear-keyvalue');
    }
  })
  ipcMain.on('set-two-category-id', () => {
    if (window) {
      window.webContents.send('set-two-category-id');
    }
  })
  ipcMain.on('clear-flow-step', (event) => {
    if (window) {
      window.webContents.send('clear-flow-step');
    }
  })
  ipcMain.on('update-location', (event) => {
    if (window) {
      window.webContents.send('update-location');
    }
  })
  ipcMain.on('query-flow-step', (event, data) => {
    if (window) {
        window.webContents.send('query-flow-step', data);
        console.log('=====:', data);
    }
  })
  ipcMain.on('open-dev-tools', (event, data) => {
    if (window) {
      window.webContents.openDevTools({ mode: 'detach' })
    }
  })

  ipcMain.handle('create-desktop-shortcut', async (event, args) => {
    try {
      const { url, title } = args
      console.log('url:=====>>>', url)
      const urlContent = `[InternetShortcut]
        URL=${url}
        IconIndex=0`

      const desktopPath = app.getPath('desktop')
      const filePath = path.join(desktopPath, `${title}.url`)
      
      fs.writeFileSync(filePath, urlContent, 'utf8')
      
      return { success: true, path: filePath }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
  return mainWindow
}