import axios from "axios";

let dynamicConfig: any = {}
export function updateDynamicConfig (config: any) {
  if(config.constructor === Object) {
    dynamicConfig = { ...dynamicConfig, ...config }
  }
  if(config.constructor === Array) {
    dynamicConfig.cookie = [...config]
  }
    localStorage.setItem('dynamicConfig',JSON.stringify(dynamicConfig))
    console.log('Dynamic config:>>>>>>',dynamicConfig)
};
export function getDynamicConfig() {
  return dynamicConfig
}
const config = localStorage.getItem('dynamicConfig')
if (config) {
  try {
    const parsedConfig = JSON.parse(config);
    updateDynamicConfig(parsedConfig);
  } catch (error) {
    console.error('解析 dynamicConfig 失败:', error);
  }
}

// 创建一个 axios 实例
const request = axios.create({
  // baseURL: 'http://192.168.10.22:8080',
  baseURL: 'http://wb-service.arthub.qq.com/blade/blade/',
  // baseURL: 'http://10.92.10.22:8080', 
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }
});
// 请求拦截器
request.interceptors.request.use(
  config => {

    console.log('Request config:', config);

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 对响应错误做点什么
    if (error.response) {
      const response = error.response;
      console.log("~~~", response);
      if (response.status === 401) {
        localStorage.removeItem("user-info");
      } else {
        // 请求已发出但服务器响应的状态码不在 2xx 范围内
        console.error("响应错误:", error.response.status, error.response.data);
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error("请求错误:", error.request);
    } else {
      // 一些设置请求时发生错误
      console.error("请求配置错误:", error.message);
    }
    return Promise.reject(error);
  }
);


export default request;
