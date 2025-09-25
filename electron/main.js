import path from 'path'
import { app, BrowserWindow, protocol, Tray, Menu, ipcMain, session, net, dialog, shell } from 'electron';
import fs from 'fs';
import toml from 'toml';
import yaml from 'js-yaml'
import { createRequire } from 'module'
import { createMainWindow } from './window/mainWindow.js'
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const iconPath = path.join(__dirname, 'icon.ico') 
import { initAegis, reportEvent, info, error, report, reportTime, setUser } from './utils/aegis'
async function tomlToJson(tomlFilePath, jsonFilePath = null) {
    try {
        // 检查文件是否存在
        if (!fs.existsSync(tomlFilePath)) {
            throw new Error(`TOML file not found: ${tomlFilePath}`);
        }
        
        // 读取 TOML 文件
        const tomlData = fs.readFileSync(tomlFilePath, 'utf-8');
        
        // 解析为 JavaScript 对象
        const jsonData = toml.parse(tomlData);
        
        // 如果指定了输出路径，则写入 JSON 文件
        if (jsonFilePath) {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        }
        
        return jsonData;
    } catch (error) {
        console.error('Error parsing TOML file:', error);
        throw error;
    }
}
// 尽早初始化 Aegis
  initAegis()
let protocolConfig = null
let mainWindow;
// 在应用启动时就处理单实例锁
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
// 处理第二个实例（Windows 上通过协议启动）
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // 从 commandLine 中提取协议 URL
  const url = commandLine.find(arg => arg.startsWith('plugflow://'))
  if (url) {
    handleCustomProtocol(url)
  }
  
  // 显示主窗口
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.whenReady().then(async() => {

  mainWindow =createMainWindow()
  


  // 注册协议
  protocol.registerFileProtocol('plugflow', (request, callback) => {
    // 解析 URL 参数
    const url = request.url;
    console.log('Custom protocol request:', url);
    
    // 处理不同的 URL 模式
    if (url.includes('plugflow://open')) {
      // 这里可以解析参数并执行相应操作
      console.log('Opening tool with custom protocol');
    }
    // 返回应用的主页面
    callback({ path: path.join(__dirname, '../renderer/index.html') });
  });

  // 监听协议链接事件
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleCustomProtocol(url)
    setTimeout(() => {
              session.defaultSession.cookies.get({
                url: 'http://wb-service.arthub.qq.com/blade/blade'
              }).then(cookies => {
                console.log('🔍 已设置的 Cookie:', cookies);
                cookies.forEach(cookie => {
                  console.log(`  ${cookie.name}=${cookie.value}`);
                });
              }).catch(error => {
                console.error('❌ 验证 Cookie 失败:', error);
              });
            }, 1000);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

  });
  

  // 创建托盘图标
  // tray = new Tray(iconPath)

  // 托盘菜单（右键菜单）
  // const contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: '打开窗口',
  //     click: () => {
  //       if (BrowserWindow.getAllWindows().length === 0) createWindow()
  //       else mainWindow.show()
  //     }
  //   },
  //   {
  //     label: '退出',
  //     click: () => {
  //       app.quit()
  //     }
  //   }
  // ])

  // tray.setToolTip('Tool Strip')
  // tray.setContextMenu(contextMenu)

  // // 点击托盘图标打开窗口
  // tray.on('click', () => {
  //   if (BrowserWindow.getAllWindows().length === 0) createWindow()
  //   else mainWindow.show()
  // })

  // 将应用设置为默认协议客户端
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('plugflow', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('plugflow');
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
  // Aegis IPC 处理器
    ipcMain.handle('aegis-call', (_e, { method, args }) => {
      try {
        switch (method) {
          case 'reportEvent':
            return reportEvent(args[0], args[1]);
          case 'info':
            return info(args[0], args[1]);
          case 'error':
            return error(args[0], args[1]);
          case 'report':
            return report(args[0], args[1]);
          case 'reportTime':
            return reportTime(args[0], args[1]);
          case 'setUser':
            return setUser(args[0]);
          default:
            console.warn('未知的 Aegis 方法:', method);
        }
      } catch (err) {
        console.error('Aegis IPC 调用失败:', err);
      }
    })
  ipcMain.handle('get-protocol-config', async (event) => {
    return protocolConfig;
  });
  mainWindow.webContents.on('did-finish-load', () => {
    const THM_LOCAL_DATA_PATH = process.env.THM_LOCAL_DATA_PATH;
    const BLADE_DESKTOP_NAME = process.env.BLADE_DESKTOP_NAME;
    const SPACE_INFO = process.env.SPACE_INFO;
    console.log('THM_LOCAL_DATA_PATH===',THM_LOCAL_DATA_PATH)
    mainWindow.webContents.send('get-local-data', {
      path: THM_LOCAL_DATA_PATH, 
      name: BLADE_DESKTOP_NAME || '',
      space: SPACE_INFO || '',
    })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

async function getLightboxCookies() {
  try {
    const cookiesFilePath = path.join(process.env.APPDATA, '_LightboxCookies', 'cookies_1.1.6.json');
    
    if (!fs.existsSync(cookiesFilePath)) {
      console.log('Lightbox cookies file not found:', cookiesFilePath);
      return null;
    }
    console.log('Lightbox cookies file found:', cookiesFilePath);
    
    const cookiesData = await fs.readFileSync(cookiesFilePath, 'utf8');
    const parsedCookies = JSON.parse(cookiesData);
    
    return parsedCookies;
  } catch (error) {
    console.error('Failed to read Lightbox cookies:', error);
    return null;
  }
}
export function getBladeUrl() {
  const blade = path.join(process.env.APPDATA, 'blade', 'config.yml');
  if (fs.existsSync(blade)) {
    const config = yaml.load(fs.readFileSync(blade, 'utf8'));
    return config;
  }
  return null;
}

async function handleCustomProtocol(url) { 
  try {
    const parsedUrl = new URL(url);
    const action = parsedUrl.hostname;
    const params = parsedUrl.searchParams;
    
    if (action === 'open') {
      const configParam = params.get('config');
      
      if (configParam) {
        try {
          protocolConfig = JSON.parse(decodeURIComponent(configParam));

          console.log('Config:', protocolConfig);

          if (protocolConfig.cookie) {
            Object.keys(protocolConfig.cookie).forEach(cookieName => {
              if (!['wwrtx.i18n_lan', 'ww_lang'].includes(cookieName)) {
                const cookieValue = protocolConfig.cookie[cookieName];
                session.defaultSession.cookies.set({
                  url: 'http://wb-service.arthub.qq.com',
                  name: cookieName,
                  value: cookieValue,
                  domain: '',
                  path: '/',
                  httpOnly: false,
                  secure: false,
                }).then(cookies => {
                  console.log(`Cookie ${cookieName} 设置成功 ${cookieName}=`,cookieValue);
                }).catch(error => {
                  console.error(`设置 Cookie ${cookieName} 失败:`, error);
                });
              }
            })
            setTimeout(() => {
              session.defaultSession.cookies.get({}).then(cookies => {
                fetchData({
                  url: '/openapi/v1/core/plug/get-plugCategory',
                })

              }).catch(error => {
                console.error('❌ 验证 Cookie 失败:', error);
              });
            }, 1000);
          }
        } catch (parseError) {
          console.error('Error parsing config JSON:', parseError);
        }
      }
    } else {
      // 发送通用协议消息
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('custom-protocol-invoked', url);
      }
    }
  } catch (error) {
    console.error('Error parsing protocol URL:', error);
  }
}

async function requestWithNet(params, fileBuffer = null, filename = null, isUpload = false) {
  let cookies = await session.defaultSession.cookies.get({})  
  let host = await getBladeUrl().arthub_service_url
  let bladeCookie = await getBladeUrl().api_cookies
  let cookieArr = bladeCookie.split(';')
  let formatCookie = cookieArr.filter(item => item.includes("arthub_account_ticket"||"accountName"||"mailAddress")).join(';')
  const urlObj = new URL(host).hostname;
  console.log('host====',host,urlObj)
  const cookieString = cookies
      .filter(cookie => ["arthub_account_ticket", "accountName", "mailAddress"].includes(cookie.name))
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ')
  if (!cookieString) {
    return
  }
  console.log('🍪 request params:', params);
  mainWindow.webContents.send('request-host', { host:urlObj,url:params.url,cookie:bladeCookie });
  if (fileBuffer && filename) {
    return uploadFileMultipart(urlObj, params, fileBuffer, filename, cookieString);
  }
  const request = net.request({
    method: 'POST',
    protocol: 'https:',
    hostname: urlObj,
    port: '',
    path: `${isUpload ? '/resolving/resolving' : '/blade/blade'}${params.url}`,
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieString,
    },
  });
  console.log('request=',request)

  return new Promise((resolve, reject) => {
    let data = '';

    // 监听响应
    request.on('response', (response) => {
      // 接收数据
      response.on('data', (chunk) => {
        data += chunk;
      });

      // 数据接收完成
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${data}`));
        }
      });
    });

    request.write(JSON.stringify(params.data) || '')

    // 处理错误
    request.on('error', reject);

    // 可选：设置超时
    setTimeout(() => {
      request.abort();
      reject(new Error('Request timeout'));
    }, 10000);

    // 发送请求
    request.end();
  });
}
function uploadFileMultipart(urlObj, params, fileBuffer, filename, cookieString) {
  return new Promise((resolve, reject) => {
    let data = '';
    
    // 生成边界字符串
    const boundary = '----ElectronFormBoundary' + Math.random().toString(36).substr(2);
    
    const request = net.request({
      method: 'POST',
      protocol: 'https:',
      hostname: urlObj,
      port: '',
      path: '/resolving/resolving' + params.url,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        cookie: cookieString,
      },
    });
      console.log('upload request=',request)
    
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${data}`));
        }
      });
    });
    
    request.on('error', reject);
    
    // 构造 multipart/form-data 数据
    let body = '';
    
    // 添加其他数据字段
    if (params.data) {
      for (const [key, value] of Object.entries(params.data)) {
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        body += `${value}\r\n`;
      }
    }
    
    // 添加文件字段
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    body += 'Content-Type: application/x-7z-compressed\r\n\r\n';
    
    request.write(body);
    request.write(fileBuffer);
    
    // 结束边界
    request.write(`\r\n--${boundary}--\r\n`);
    
    setTimeout(() => {
      request.abort();
      reject(new Error('Request timeout'));
    }, 30000); // 文件上传可能需要更长时间
    
    request.end();
  });
}

async function fetchData(params) {
  try {
    const data = await requestWithNet(params);
    console.log('Data from net module:', data);
     mainWindow.webContents.send('request-data', data );
     if(!data) {
      dialog.showMessageBox({
        type: 'error',
        title: '提示',
        message: '请求失败,请检查登录态'
      });
     }
     if(data && data.code !== 0) {
      mainWindow.webContents.send('request-failed', {'error':data.error,'url':params.url});
     }
    let { url } = params
    if (url.includes('/openapi/v1/core/plug/get-plugProcessStep')) {
      mainWindow.webContents.send('get-plugProcessStep', data);
    } else if (url.includes('/openapi/v1/core/get-step-tools')) {
      mainWindow.webContents.send('get-step-tools', data);
    } else if (url.includes('/openapi/v1/core/plug/get-step-docs')) {
      mainWindow.webContents.send('get-step-docs', data);
    } else if (url.includes('/openapi/v1/core/plug/global-search')) {
      mainWindow.webContents.send('global-search', data);
    } else if (url.includes('/openapi/v1/core/plug/get-plugCategory')) {
      mainWindow.webContents.send('get-data', data);
    }
  } catch (error) {
    mainWindow.webContents.send('request-failed', {'error':error,'url':params.url});
    console.error('Net request failed:', error);
    // dialog.showMessageBox({
    //   type: 'error',
    //   title: '提示',
    //   message: `${params.url}请求失败，请检查登录信息是否正确后再行尝试！`
    // });

  }
}

ipcMain.on('fetch-data', (event,data) => {
    fetchData(data)
})
let globalCookieData = null;
ipcMain.on('get-cookie-data',async (event,data)=> {
  let host = await getBladeUrl().arthub_service_url
  let api_cookies = await getBladeUrl().api_cookies
  let apiArr = api_cookies.split(';')
  let target = []
  const requiredCookies = ['arthub_account_ticket', 'accountName', 'mailAddress'];
  apiArr.forEach(item => {
    const [name, value] = item.trim().split('=');
    if (name && value && requiredCookies.includes(name)) {
      target.push({ name, value });
    }
  })

  let localCookie = await getLightboxCookies()
  if(localCookie) {
      console.log('host =',host)
      let cookies = []
      if(target.length){
        cookies = [...target]
      } else {
        for(let key in localCookie) {
          if(key.includes('blade')) {
            cookies = localCookie[key];
          }
        }
      }
      globalCookieData = cookies
      mainWindow.webContents.send('get-cookie-data', cookies)

      cookies.length && cookies.forEach(cookieName => {
              if (['arthub_account_ticket', 'accountName','mailAddress'].includes(cookieName.name)) {
                session.defaultSession.cookies.set({
                  url: 'http://service.arthub.qq.com',
                  name: cookieName.name,
                  value: cookieName.value,
                  domain: '',
                  path: '/',
                  httpOnly: false,
                  secure: false,
                }).then(cookies => {
                  console.log(`Cookie ${cookieName.name} 设置成功 ${cookieName.name}=`,cookieName.value);
                }).catch(error => {
                  console.error(`设置 Cookie ${cookieName.name} 失败:`, error);
                });
              }
            })
            //todo:先检测本地配置文件，没有则请求服务器数据
              uploadTomFile()

      }
})
async function uploadTomFile() {
  const PLUG_CONFIGS = process.env.PLUG_CONFIGS;
  console.log('PLUG_CONFIGS:===>', PLUG_CONFIGS);
  
  
  if (!PLUG_CONFIGS) {
    console.log('PLUG_CONFIGS 环境变量未设置');
    mainWindow.webContents.send('file-parsing-completed', {code: 1});
    return;
  }
  
  const tomlFilePath = path.join(process.env.PLUG_CONFIGS);
  const fileNameWithExt = path.basename(tomlFilePath);
    const fileNameWithoutExt = path.basename(tomlFilePath, path.extname(tomlFilePath));
    console.log('tomlFilePath:===>', tomlFilePath,fileNameWithExt,fileNameWithoutExt);
  // 检查文件是否存在
  if (!fs.existsSync(tomlFilePath)) {
    console.log('压缩文件不存在:', tomlFilePath);
    mainWindow.webContents.send('file-parsing-completed', {code: 1});
    return;
  }
  
  console.log('PLUG_CONFIGS目录是否存在:', fs.existsSync(process.env.PLUG_CONFIGS));
  
  try {
    // 读取文件
    const fileBuffer = fs.readFileSync(tomlFilePath);
    console.log('文件读取成功，大小:', fileBuffer.length, '字节');
    // 上传文件
      let uploadParams = { 
        url: '/openapi/v1/cgm-plug/upload',
        data: {
          // 可以添加其他需要的字段
          package_name: fileNameWithoutExt,
          version: '0.57.1025'
        }
      };
      
      console.log('开始上传文件...');
      const uploadZipFile = await requestWithNet(uploadParams, fileBuffer, fileNameWithExt);
      
      if (uploadZipFile && uploadZipFile.code == 0) {
        // 先触发创建包事件
        let createPackageParams = { 
          url: '/openapi/v1/core/trigger-create-package-event',
          data: { 
            "package": {
              "name": fileNameWithoutExt,
              "version":"0.57.1025",
              "space_name": "gzta"
            },
            "upsert": true
          }
        };
        
        console.log('触发创建包事件...');
        const createPackageResponse = await requestWithNet(createPackageParams,null,null,true);
        console.log('文件上传成功，开始轮询解析状态...',createPackageResponse);
        if(createPackageResponse && createPackageResponse.code == 0) {
          isGetFileData()

        }
      } else {
        console.error('文件上传失败:', uploadZipFile);
      }
    
  } catch (error) {
    console.error('文件读取或上传过程中出错:', error);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('file-upload-error', error.message);
    }
  }
}
function isGetFileData() {
  let params = { 
    url: '/openapi/v1/cgm-plug/is-finished',
    data: {}
  };
  
  let attempts = 0;
  const maxAttempts = 20
  
  // 创建定时器
  const timer = setInterval(async () => {
    try {
      attempts++;
      console.log(`第 ${attempts} 次轮询文件解析状态...`);
      
      const result = await requestWithNet(params,null,null,true);
      
      if (result && result.code == 0) {
        // 检查解析是否完成 - 根据实际API返回结构调整判断条件
        if (result.result == false) {
          console.log('文件解析完成');
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('file-parsing-completed', {code: 0});
          };
          // 清除定时器
          clearInterval(timer);
          return;
        } else {
          console.log('文件仍在解析中...');
        }
      } else {
        console.warn(`第 ${attempts} 次轮询返回错误:`, result);
      }
      
      // 检查是否达到最大尝试次数
      if (attempts >= maxAttempts) {
        console.error('轮询超时，文件解析未在预期时间内完成');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('file-parsing-timeout', {
            error: '轮询超时，文件解析未在预期时间内完成',
            maxAttempts: maxAttempts,
            lastResponse: result
          });
        }
        // 清除定时器
        clearInterval(timer);
      }
    } catch (error) {
      console.error(`第 ${attempts} 次轮询出错:`, error);
      
      // 检查是否达到最大尝试次数
      if (attempts >= maxAttempts) {
        console.error('轮询超时，文件解析未在预期时间内完成');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('file-parsing-timeout', {
            error: '轮询超时，文件解析未在预期时间内完成',
            maxAttempts: maxAttempts,
            lastError: error.message
          });
        }
        // 清除定时器
        clearInterval(timer);
      }
    }
  }, 5000)

}

ipcMain.on('open-work-wechat-contact', async (event, contactInfo) => {
  try {
    let success = false;
    let errorMessages = [];
    if (contactInfo.name) {
      try {
        const encodedName = encodeURIComponent(contactInfo.name)
        // 企业微信用户邮箱方式打开
        const wechatUrl = `wxwork://message/?username=${encodedName}`;
        // const wechatUrl = `wxwork://message/?userid=${contactInfo.userId}`;
        const result = await shell.openExternal(wechatUrl);
        if (result) {
          success = true;
          console.log('成功打开企业微信');
        } else {
          errorMessages.push('打开企业微信失败');
        }
      } catch (error) {
        errorMessages.push(`用户ID方式失败: ${error.message}`);
      }
    }

    if (!success) {
      try {
        // 尝试打开企业微信主程序
        const wechatUrl = 'wxwork://';
        const result = await shell.openExternal(wechatUrl);
        if (result) {
          success = true;
          console.log('成功打开企业微信主程序');
        } else {
          errorMessages.push('打开企业微信主程序失败');
        }
      } catch (error) {
        errorMessages.push(`打开企业微信主程序失败: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('打开企业微信失败:', error);
    
    // 备用方案：打开企业微信官网或提示用户
    try {
      await shell.openExternal('https://work.weixin.qq.com/');
    } catch (fallbackError) {
      console.error('打开备用链接失败:', fallbackError);
      // 可以在这里显示错误提示给用户
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('open-wechat-failed', {
          error: error.message,
          contact: contactInfo
        });
      }
    }
  }
});

export { protocolConfig }