/**
 * Aegis Electron SDK 集成
 * 在主进程中初始化和管理 Aegis 监控
 */
// const Aegis = require('@tencent/aegis-electron-sdk-v2');
import Aegis from '@tencent/aegis-electron-sdk-v2';
import { screen } from 'electron';


// Aegis 实例
let aegisInstance = null;

/**
 * 初始化 Aegis
 */
function initAegis(info) {
  try {
    const mailAddress = info.find((item) => item.name == 'mailAddress')
    const userInfo = {
      email: decodeURIComponent(mailAddress.value) || 'unknown',
    };

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const density = primaryDisplay.scaleFactor;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;

    const url = 'https://galileotelemetry.tencent.com/collect'; // 伽利略上报地址，不变
    const id = 'SDK-97007142ac36659869b9'; // 项目token

    const extraInfo = {};
    const memoryUsage = process.memoryUsage();
    extraInfo.mainMemory = Math.round(memoryUsage.rss / 1024) + 'k'
    // extraInfo.main_memory_heap_mb = Math.round(memoryUsage.heapUsed / 1024);
    extraInfo.mainMemoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) + '%';
    // 获取用户信息
    const userEmail = userInfo.email;
    const completeExtraInfo  = {
      screen_width: width,
      screen_height: height,
      screen_density: density,
      screen_resolution: `${width}x${height}`,
      timezone: timezone,
      locale: locale,
      email: userInfo.email,
      ...extraInfo,
    };
    
    // 在主进程尽可能早的初始化注册Aegis实例
    aegisInstance = new Aegis({
      id, // 项目上报id
      uid: userInfo.email, // 用户唯一标识
      env: 'production',
      hostUrl: url, // 上报域名
      plugin: {
        processPerformance: true, // 性能，包括cpu和内存
        error: true, // 错误上报
        network: true,               // 网络请求监控
        device: true,                // 设备信息
        lifecycle: true,             // 应用生命周期
        memory: true,                // 内存详细信息
        cpu: true,
      },
      extField: completeExtraInfo,
      processPerformanceInterval: 2, // 性能上报时间间隔，单位分钟，默认5分钟
      networkInterval: 5, // 网络状态更新时间间隔，单位分钟，默认5分钟
    });
    console.log('Aegis Electron SDK 初始化成功',aegisInstance);
    
    // 上报应用启动事件
    reportEvent('app_startup');

    // startPerformanceMonitoring(); // 开始性能监控

  } catch (error) {
    console.error('Aegis 初始化失败:', error);
  }
}


/**
 * 上报自定义事件
 */
function reportEvent(eventName, extData) {
  console.log('上报事件running :', eventName, extData)
  if (aegisInstance) {
    try {
      aegisInstance.reportEvent(eventName);
      if (extData) {
        aegisInstance.info(`Event: ${eventName}`, extData);
      }
    } catch (error) {
      console.error('Aegis reportEvent 失败:', error);
    }
  } else {
    console.warn('Aegis 未初始化，无法上报事件:', eventName);
  }
}

/**
 * 上报信息日志
 */
function info(message, data) {
  if (aegisInstance) {
    try {
      aegisInstance.info(message, data);
    } catch (error) {
      console.error('Aegis info 失败:', error);
    }
  } else {
    console.warn('Aegis 未初始化，无法上报信息:', message);
  }
}

/**
 * 上报错误日志
 */
function error(message, errorData) {
  if (aegisInstance) {
    try {
      aegisInstance.error(message, errorData);
    } catch (error) {
      console.error('Aegis error 失败:', error);
    }
  } else {
    console.warn('Aegis 未初始化，无法上报错误:', message);
  }
}

/**
 * 上报普通日志
 */
function report(message, data) {
  if (aegisInstance) {
    try {
      aegisInstance.report(message, data);
    } catch (error) {
      console.error('Aegis report 失败:', error);
    }
  } else {
    console.warn('Aegis 未初始化，无法上报日志:', message);
  }
}

/**
 * 上报自定义测速
 */
function reportTime(name, duration) {
  if (aegisInstance) {
    try {
      aegisInstance.reportTime(name, duration);
    } catch (error) {
      console.error('Aegis reportTime 失败:', error);
    }
  } else {
    console.warn('Aegis 未初始化，无法上报测速:', name);
  }
}

/**
 * 设置用户信息
 */
function setUser(uid) {
  if (aegisInstance) {
    try {
      aegisInstance.setConfig({uid});
    } catch (error) {
      console.error('Aegis setUser 失败:', error);
    }
  } else {
    console.warn('Aegis 未初始化，无法设置用户:', uid);
  }
}

/**
 * 获取 Aegis 实例
 */
function getAegisInstance() {
  return aegisInstance;
}

/**
 * 业务场景封装
 */
class AegisMainReporter {
  
  /**
   * 上报窗口创建事件
   */
  static reportWindowCreate(windowName) {
    reportEvent(`window_create_${windowName}`);
    info(`Window created: ${windowName}`, { windowName, timestamp: Date.now() });
  }

  /**
   * 上报窗口关闭事件
   */
  static reportWindowClose(windowName) {
    reportEvent(`window_close_${windowName}`);
    info(`Window closed: ${windowName}`, { windowName, timestamp: Date.now() });
  }

  /**
   * 上报应用错误
   */
  static reportAppError(errorType, errorMessage, stack) {
    error(`App Error: ${errorType}`, {
      errorType,
      errorMessage,
      stack,
      timestamp: Date.now(),
      platform: process.platform,
      version: process.versions.electron
    });
  }

  /**
   * 上报IPC通信事件
   */
  static reportIpcEvent(channel, action, success = true) {
    const eventName = success ? `ipc_${channel}_success` : `ipc_${channel}_error`;
    reportEvent(eventName);
    info(`IPC Event: ${channel} - ${action}`, {
      channel,
      action,
      success,
      timestamp: Date.now()
    });
  }

  /**
   * 上报性能指标
   */
  static reportPerformance(metricName, value, unit = 'ms') {
    reportTime(metricName, value);
    info(`Performance: ${metricName}`, {
      metricName,
      value,
      unit,
      timestamp: Date.now()
    });
  }

  /**
   * 上报应用生命周期事件
   */
  static reportAppLifecycle(event) {
    reportEvent(`app_${event}`);
    info(`App lifecycle: ${event}`, {
      event,
      timestamp: Date.now(),
      platform: process.platform
    });
  }

  /**
   * 上报网络状态变化
   */
  static reportNetworkStatus(isOnline) {
    const eventName = isOnline ? 'network_online' : 'network_offline';
    reportEvent(eventName);
    info(`Network status: ${isOnline ? 'online' : 'offline'}`, {
      isOnline,
      timestamp: Date.now()
    });
  }

  /**
   * 上报用户登录状态
   */
  static reportUserLogin(userEmail) {
    setUser(userEmail);
    reportEvent('user_login');
    info('User login', {
      userEmail,
      timestamp: Date.now()
    });
  }
}
export {
  initAegis,
  reportEvent,
  info,
  error,
  report,
  reportTime,
  setUser,
  getAegisInstance,
  AegisMainReporter
}