
import request from "../axios/index";

/**
 * 获取一二级分类接口
 * */
const getPlugCategory = (data: any) => {
  return request({ url: `/openapi/v1/core/plug/get-plugCategory`, method: "post", data });
};
/**
 * 获取工具接口
 * */
const getStepTools = (data: any) => {
  return request({ url: `/openapi/v1/core/get-step-tools`, method: "post", data });
};
/**
 * 获取流程步骤文档数据分页
 * */
const getStepDocs = (data: any) => {
  return request({ url: `/openapi/v1/core/plug/get-step-docs`, method: "post", data });
};
/**
 * 获取流程步骤文档数据分页
 * */
const globalSearch = (data: any) => {
  return request({ url: `/openapi/v1/core/plug/global-search`, method: "post", data });
};
/**
 * 获取流程步骤
 * */
const getPlugProcessStep = (data: any) => {
  return request({ url: `/openapi/v1/core/plug/get-plugProcessStep`, method: "post", data });
};

export const toolApi = {
  getPlugCategory,
  getStepTools,
  getStepDocs,
  globalSearch,
  getPlugProcessStep
};
