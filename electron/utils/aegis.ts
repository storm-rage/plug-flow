/**
 * Aegis Electron SDK 集成
 * 在主进程中初始化和管理 Aegis 监控
 */

const Aegis = require('@tencent/aegis-electron-sdk-v2');

// Aegis 实例
let aegisInstance: any = null;

/**
 * 初始化 Aegis
 */
export function initAegis(): void {
  try {
    const url = 'https://galileotelemetry.tencent.com/collect'; // 伽利略上报地址，不变
    const id = 'SDK-97007142ac36659869b9'; // 项目token
    
    // 在主进程尽可能早的初始化注册Aegis实例
    aegisInstance = new Aegis({
      id, // 项目上报id
      uid: '', // 用户唯一标识
      env: process.env.NODE_ENV === 'development' ? 'development' : 'production',
      hostUrl: url, // 上报域名
      plugin: {
        processPerformance: true, // 性能，包括cpu和内存
        error: true, // 错误上报
      },
      processPerformanceInterval: 2, // 性能上报时间间隔，单位分钟，默认5分钟
      networkInterval: 5, // 网络状态更新时间间隔，单位分钟，默认5分钟
    });
    console.log('Aegis Electron SDK 初始化成功');
    
    // 上报应用启动事件
    reportEvent('app_startup');
    
  } catch (error) {
    console.error('Aegis 初始化失败:', error);
  }
}

/**
 * 上报自定义事件
 */
export function reportEvent(eventName: string, extData?: Record<string, any>): void {
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
export function info(message: string, data?: Record<string, any>): void {
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
export function error(message: string, errorData?: any): void {
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
export function report(message: string, data?: Record<string, any>): void {
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
export function reportTime(name: string, duration: number): void {
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
export function setUser(uid: string): void {
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
export function getAegisInstance(): any {
  return aegisInstance;
}

/**
 * 业务场景封装
 */
export class AegisMainReporter {
  
  /**
   * 上报窗口创建事件
   */
  static reportWindowCreate(windowName: string): void {
    reportEvent(`window_create_${windowName}`);
    info(`Window created: ${windowName}`, { windowName, timestamp: Date.now() });
  }

  /**
   * 上报窗口关闭事件
   */
  static reportWindowClose(windowName: string): void {
    reportEvent(`window_close_${windowName}`);
    info(`Window closed: ${windowName}`, { windowName, timestamp: Date.now() });
  }

  /**
   * 上报应用错误
   */
  static reportAppError(errorType: string, errorMessage: string, stack?: string): void {
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
  static reportIpcEvent(channel: string, action: string, success: boolean = true): void {
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
  static reportPerformance(metricName: string, value: number, unit: string = 'ms'): void {
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
  static reportAppLifecycle(event: 'ready' | 'activate' | 'before-quit' | 'will-quit' | 'window-all-closed'): void {
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
  static reportNetworkStatus(isOnline: boolean): void {
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
  static reportUserLogin(userEmail: string): void {
    setUser(userEmail);
    reportEvent('user_login');
    info('User login', {
      userEmail,
      timestamp: Date.now()
    });
  }
}
