<script setup lang="ts">
import { onBeforeMount, reactive, ref, computed, onMounted } from "vue";
import { SearchIcon } from 'tdesign-icons-vue-next';
import Peace from '../../assets/peace.png';
import PhotonLogo from '../../assets/photon-logo1.png';
import TopBar from "./topBar/index.vue"
import type { InputProps } from 'tdesign-vue-next';
import { useRouter } from 'vue-router'
import { debounce } from "lodash";
import Aegis from 'aegis-web-sdk';


const electronAPI = (window as any).electronAPI;

const router = useRouter()
interface TabItem {
  name: string;
  path?: string;
  index: number;
  child?: TabItem[];
  id: string;
}
let isShowSubTab = computed(() => {
  if(router.currentRoute.value.path == '/' && tabs.length > 0) {
    return true
  } else {
    return false
  }
});
const title = ref('和平精英');
let tabs = reactive<any>([])
let tabsTop = reactive<TabItem[]>([])
let activeTabTop = ref(0);
let activeTab = ref(0);

const debouncedHandleTabsTopClick  = debounce((tab:any,index:any) => { 
  if (tab?.id !== undefined && tab?.id !== null && electronAPI?.send) {
      electronAPI.send('update-location');
    }
    isTabClick.value = true
  const selectedTab = tabsTop[index]
  if (selectedTab) {
    activeTabTop.value = index
    let childTab = tabsTop[index].child
    if (Array.isArray(childTab) && childTab.length > 0) {
      tabs.splice(0, tabs.length, ...childTab) // 清空并替换

      let cachedTabIndex = 0; // 默认为第一个
      try {
        const currentTabStr = localStorage.getItem('currentTab')
        console.log('currentTabStr', currentTabStr)
        if (currentTabStr) {
          const currentTab = JSON.parse(currentTabStr);
          if (currentTab && currentTab.id) {
            const foundIndex = childTab.findIndex((item: any) => item.id === currentTab.id);
            if (foundIndex !== -1) {
              cachedTabIndex = foundIndex;
            }
          }
        }
      } catch (error) {
        console.error('解析 currentTab 失败:', error);
      }
      
      // 设置 activeTab 为缓存的 tab 或默认第一个
      activeTab.value = cachedTabIndex;
    } else {
      tabs.splice(0, tabs.length)
      localStorage.setItem('currentTab', '')
      activeTab.value = 0; // 重置为默认值

    }
    console.log('tabs===>',tabs)
    //todo:如果当前不在流程页面，则跳转到流程页面
    if (router.currentRoute.value.path != '/') {

      router.push('/')
      searchText.value = ''
      sessionStorage.setItem('searchText', '')
    }
    //todo:请求新的流程数据
    if(tabs.length) {
      
      handleTabsClick(tabs[activeTab.value], activeTab.value);
    } else {
      //清空流程数据
      (window as any).electronAPI?.send('clear-flow-step');
    }
    
  }
}, 10);
function handleTabsTopClick(tab:any,index : any) {
  debouncedHandleTabsTopClick(tab,index)
}
let isSendingQuery = ref(false);

const debounceSendQuery = debounce((tabId: any) => {
  if (isSendingQuery.value) {
    console.log('请求已被阻止，正在发送中:', tabId);
    return;
  }
  isSendingQuery.value = true;
  if (tabId !== undefined && tabId !== null && electronAPI?.send) {
    console.log('发送 query-flow-step 事件:', tabId);
    electronAPI.send('query-flow-step', tabId);
  }
  setTimeout(() => {
    isSendingQuery.value = false;
  }, 1000);
}, 10);

let isTabClick = ref(false)
const debouncedTabsClick = debounce((tab:any,index:any) => { 
  
  if(!tab.id) {
    return
  }
  if(tab.id) {
    let currentTab = JSON.parse(localStorage.getItem('currentTab') || '{}')
    if(currentTab.id == tab.id) {
      return
    }
  }
  isTabClick.value = true
  console.log('choose index=',index)
  sessionStorage.setItem('isFlowLoaded', JSON.stringify(false))
  localStorage.setItem('currentTab', JSON.stringify(tab))
  if(tab.contactPerson) {
    contactPerson.value = tab.contactPerson
  } else {
    contactPerson.value = ''
  }
  try {
    debounceSendQuery(tab.id)
  } catch (error) {
    console.error('Search navigation:', error);
  }
  const selectedTab = tabs[index]
  if (selectedTab) {
    activeTab.value = index
  }
}, 10);
function handleTabsClick(tab:any,index:any) {
  debouncedTabsClick(tab,index)
}
let searchText = ref("");
function handleSearchChange(val: any) {
  searchText.value = val
}
function handleSearchEnter(val : any) {
  if (!val?.trim()) {
    return
  }
  sessionStorage.setItem('searchText', val)
  const currentRouteName = router.currentRoute.value.name;
  let queryParams = {
    keyword: val,
    FirstCategoryId: tabsTop[activeTabTop.value]?.id,
  }
  console.log('queryParams', queryParams)
  let isPlugLocalConfig = sessionStorage.getItem('isPlugLocalConfig')
  let handleVersion = isPlugLocalConfig ? JSON.parse(isPlugLocalConfig) : null;
  let obj = {
              url:`/openapi/v1/core/plug/global-search?debug_version=${handleVersion ? 0 : 1}`,
              data: {
                  "keyword": queryParams.keyword || searchText,
                  "FirstCategoryId": Number(queryParams.FirstCategoryId),
                  "orderBy": "updateTime",
                  "OrderDesc": false,
              }
          };
      electronAPI?.send('fetch-data', obj)
  
  try {
    // 如果当前已在查询结果页面，则通知页面更新搜索结果
    if (currentRouteName === 'queryResult' && electronAPI?.send) {
      // electronAPI.send('query-keyword', queryParams);
    } else {
      // 否则跳转到查询结果页面
      router.push({ 
        name: 'queryResult', 
        query: { 
          searchText: val.trim(),
          FirstCategoryId: queryParams.FirstCategoryId,
         } 
      });
    }
  } catch (error) {
    console.error('Search navigation error:', error);
  }
}
const onClear: InputProps['onClear'] = () => {
  console.log('clear');
};
let contactPerson = ref('')
let userInfo = ref([])
onBeforeMount(() => { 
  (window as any).electronAPI?.on('get-cookie-data',(res:any) => { 
    userInfo.value = res
    console.log('<<<<< get-cookie-data==',res)
    initReporting({})
  });
  if((window as any).electronAPI) {
    (window as any).electronAPI.on('file-parsing-completed', (res:any) => { 
        console.log('file-parsing-completed', res)
        if(res.code == 0) {
            loading.value = false
          sessionStorage.setItem('isPlugLocalConfig', JSON.stringify(true));
          let isPlugLocalConfig = sessionStorage.getItem('isPlugLocalConfig')
          let handleVersion = isPlugLocalConfig ? JSON.parse(isPlugLocalConfig) : null;

          if((window as any).electronAPI) {
              if(handleVersion) {
                            console.log('run this code == 0~~~~~~~~~~')

                electronAPI?.send('fetch-data',{
                  url: `/openapi/v1/core/plug/get-plugCategory?debug_version=${handleVersion ? 0 : 1}`,
                });
              }
          }
        } else if(res.code == 1) {
          loading.value = false
          let isPlugLocalConfig = sessionStorage.getItem('isPlugLocalConfig')
          let handleVersion = isPlugLocalConfig ? JSON.parse(isPlugLocalConfig) : null;
          if((window as any).electronAPI) {
            console.log('run this code == 1~~~~~~~~~~')
                electronAPI?.send('fetch-data',{
                  url: `/openapi/v1/core/plug/get-plugCategory?debug_version=${handleVersion ? 0 : 1}`,
                });
              
          }
        }
    });
  }
  

  if((window as any).electronAPI) {
      electronAPI?.send('get-cookie-data');
  }
  setTimeout(() => {
    let currentTab = JSON.parse(localStorage.getItem('currentTab') || '{}')
    if(currentTab) {
      console.log('get tab cache',tabsTop,currentTab)
      tabsTop.length && tabsTop.some((i: any, index: number) => { 
        if(i.child.length > 0){
          let findIndex = i.child.findIndex((j: any) => j.id === currentTab.id)
          console.log('findTarget', findIndex)
          if(findIndex !== -1) {
            activeTabTop.value = index
            activeTab.value = findIndex
            contactPerson.value = i.child[activeTab.value].contactPerson
            return true 
          }else {
            // activeTabTop.value = index
            // activeTab.value = 0
            // return true

          }
        }
        return false
      })
      console.log('active tab',activeTabTop.value,activeTab.value)
      let childTab = tabsTop[activeTabTop.value]?.child
      if (Array.isArray(childTab) && childTab.length > 0) {
        tabs.splice(0, tabs.length, ...childTab)
      }
    }
  }, 10);
  
})
onMounted(() => { 
  searchText.value = sessionStorage.getItem('searchText') || '';
  (window as any).electronAPI.on('clear-keyvalue', () => { 
    searchText.value = ''
    sessionStorage.setItem('searchText', '')
    const currentTabStr = localStorage.getItem('currentTab');
    const currentTab = currentTabStr && JSON.parse(currentTabStr);
    if(currentTab.id) {
      debounceSendQuery(currentTab.id)
    }
  });
  electronAPI.on('get-data',(res:any) => {
    console.log('<<<<<<<<<<<<<<<一二级分类数据get data==',res)
      const currentTabStr = localStorage.getItem('currentTab');
      const currentTab = currentTabStr && JSON.parse(currentTabStr);
      if(res && res.code == 0) {
        tabsTop.splice(0, tabsTop.length, ...res.result)
        let categoryId = null

          res.result.some((i:any,index:number) => { 
            if(currentTab) {
              if(i.child.length) {
                let findIndex = i.child.findIndex((item:any) => item.id == currentTab.id);
                console.log('findIndex>>',findIndex)
                if(findIndex !== -1) {
                  activeTabTop.value = index
                  activeTab.value = findIndex
                  tabs.splice(0, tabs.length, ...i.child)
                  contactPerson.value = i.child[0].contactPerson
                  console.log('tabs',tabs,i.child)
                  categoryId = currentTab.id
                  //找到了退出循环
                  return true
                } else {
                  activeTabTop.value = 0
                  // activeTabTop.value = index
                  tabs.splice(0, tabs.length, ...res.result[0].child)
                  localStorage.setItem('currentTab', JSON.stringify(res.result[0].child[0]))
                  categoryId = res.result[0].child[0].id
                  contactPerson.value = res.result[0].child[0].contactPerson
                }
              }
            }else {
              if(i.child.length > 0) {
                activeTabTop.value = 0
                tabs.splice(0, tabs.length, ...res.result[0].child)
                localStorage.setItem('currentTab', JSON.stringify(res.result[0].child[0]))
                categoryId = res.result[0].child[0].id
                contactPerson.value = res.result[0].child[0].contactPerson
              }
            }
          })
          console.log('active tab id',currentTab, categoryId)
            debounceSendQuery(categoryId)
      }
    });
  electronAPI.on('request-failed',(res:any) => {
    console.error('request-failed',res)
  });
  electronAPI.on('request-data',(res:any) => {
    console.log('request-data',res)
  });
  electronAPI.on('get-local-data',(res:any) => {
    console.log('get-local-data',res)
    sessionStorage.setItem('localData', JSON.stringify(res))
  });
  electronAPI.on('request-host',(res:any) => {
    console.log('request-host ',res)
  });
  electronAPI?.on('open-wechat-failed', (res: any) => {
    console.log('打开企业微信失败:', res);
    // 可以在这里显示提示信息给用户
    alert(`无法打开企业微信，请手动联系: ${res.contact.name}`);
  });
    
})
let loading = ref(true)
async function initReporting ({}) {
  try {
    let user = {};
    try {
      user = (window as any).electronAPI?.getUserInfo?.() || {};
    } catch (e) {
      console.warn('Failed to get user info:', e);
    }

    // 获取全局变量信息（适配 Vue3 Composition API）
    const globalData = (window as any).$global || (window as any).globalData || {};
    const appName = (window as any).appName || 'plug-flow';
    const version = globalData.desktopCenter?.version || '1.0.0';

    const url = 'https://galileotelemetry.tencent.com/collect'; // 伽利略上报地址，不变
    const id = 'SDK-97007142ac36659869b9'; // 插板id
    console.log('AegisV2 init', id, user, globalData, appName, version, userInfo.value);
    // let mailAddress = userInfo.value.find(i => i.name == 'mailAddress')
    let mail = '';
    userInfo.value.forEach((item: any) => {
      if(item.name == 'mailAddress') {
        mail = item.value
      }
    });
    // 初始化 Aegis 实例
    (window as any).AegisV2 = new Aegis({
      id, // 项目token，即上报伽利略监控的唯一标识
      uid: mail || 'unknown', // 用户邮箱
      hostUrl: url ,
      // 自定义扩展字段
      extField: {
        app_version: version,
        app_name: appName,
      },
      beforeReport(event:any) {
        if (event.msg?.includes('"isTrusted":true')) {
          // 过滤掉无意义的 Promise Error
          return false;
        }
        return true;
      },
      plugin: {
        device: true,  // 设备信息收集
        error: true,   // 错误监控
        pv: true,      // 页面访问统计
        performance: true, // 性能监控
      },
    });

    console.log('AegisV2 initialized successfully');
  } catch (error) {
    console.error('Aegis initialization failed:', error);
  }
}
function openWorkWechatContact() {
  if (!contactPerson.value) return;
  try {
    // 构造联系人信息对象
    const contactInfo = {
      name: contactPerson.value.split('：')[1],
      email: '', // 如果有邮箱信息可以添加
      userId: '', // 如果有企业微信用户ID可以添加
      kfId: '' // 如果有客服ID可以添加
    };
    
    // 发送 IPC 消息到主进程
    electronAPI?.send('open-work-wechat-contact', contactInfo);
    console.log('发送打开企业微信请求成功', contactInfo);
  } catch (error) {
    console.error('发送打开企业微信请求失败:', error);
  }
}

</script>
<template>
  <top-bar/>
  <div class="main">
    <div class="container">
      <div class="left">
          <div class="logo">
            <img :src="Peace" alt="Peace"></img>
          </div>
          <div class="title">{{title}}</div>
        </div>
      <div class="tabs">
        <div 
          class="sub-tab" 
          :class="activeTabTop == index ? 'active' : ''"
          v-for="(tab, index) in tabsTop" 
          @click="handleTabsTopClick(tab,index)"
          >
               {{tab.name}}
        </div>
      </div>
      <div class="search">
          <t-input 
            placeholder="搜索工具/文档" 
            clearable
            v-model="searchText"
            @change="handleSearchChange"
            @enter="handleSearchEnter"
            @clear="onClear"
            >
            <template #prefixIcon>
              <search-icon />
            </template>
          </t-input>
      </div>
    </div>
    <div class="content">
      <div class="tabs" v-if="isShowSubTab">
        <div 
          class="sub-tab" 
          :class="activeTab == index ? 'active' : ''"
          v-for="(tab,index) in tabs"
          @click="handleTabsClick(tab,index)"
          >
                {{tab.name}}
        </div>
      </div>
      <t-loading :loading="loading" text="文件解析中..." 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000;"
      />
      <router-view />
      <div class="contact-person" v-if="isShowSubTab">
        接口人：<span
        class="contact-link"
        @click="openWorkWechatContact"
        >{{ `${contactPerson}` }}</span>
      </div>
      <div class="photon-logo">
        <img :src="PhotonLogo" alt="logo"></img>
      </div>
    </div>
</div>
  
</template>
<style scoped lang="less">
.photon-logo {
    bottom: -50px;
    pointer-events: none;
    position: fixed;
    right: -50px;
    z-index: 99;
    img {
      opacity: .15;
      width: 400px;
    }
}
.main {
  position: relative;
  top: 52px;
  height: calc(100% - 64px);
}
.container {
  padding: 15px 40px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #17181a;
  .left {
    display: flex;
    align-items: center;
    .logo {
      width: 30px;
      height: 30px;
      img {
        width: 100%;
        height: 100%;
      }
    }
    .title {
        margin-left: 10px;
    }
  }
  .tabs {
      display: flex;
      .sub-tab {
          cursor: pointer;
          color: #b2b2b2;
          font-size: 16px;
          margin: 0 20px;
          &:hover,&.active {
              color: #3484ea;
              font-weight: 600;
              border-bottom: 1px solid #3484ea;
          }
      }
  }
  .search {
    width: 224px;
    margin-right: 4px;
  }
}
.content { 
  position: relative;
  height: calc(100% - 50px);
  font-size: 12px;
  color: #dfdfdf;
  background-color: #141517;
  .tabs {
    position: absolute;
    left: 0px;
    display: flex;
    z-index: 999;
    width: calc(100% - 40px);
    background-color: #141517;
    padding-left: 40px;
    .sub-tab {
      height: 40px;
      line-height: 40px;
      cursor: pointer;
      color: #b2b2b2;
      font-size: 16px;
      margin-right: 40px;
      &:hover,&.active {
              color: #3484ea;
              font-weight: 600;
              border-bottom: 1px solid #3484ea;
          }
    }
  }
  .contact-person {
    position: absolute;
    right: 10px;
    bottom: 10px;
    .contact-link {
      font-size: 16px;
      text-decoration: underline;
      color: rgba(45, 120, 216, 0.80);
      line-height: 24px;
      cursor: pointer;
      &:hover {
        color: rgba(45, 120, 216, 1);
      }
    }
  }
}
:deep(.t-input){
  --td-text-color-placeholder: #aaa; /* 设置 placeholder 颜色 */
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}
:deep(.t-input--focused) {
  --td-brand-color: #029de5; /* 设置品牌色，会影响焦点边框 */
  border-color: #029de5 !important;
  box-shadow: 0 0 0 2px rgba(2, 157, 229, 0.2) !important;
}
:deep(.t-input__inner) {
  color: #fff;
}

:deep(.t-dialog) {
  color: #ababab;
  background-color: #222;
  border: transparent;
}
:deep(.t-dialog__body) {
  color: #ababab;
}
:deep(.t-dialog__header .t-dialog__header-content) {
    color: #ababab;
}
:deep(.t-dialog__close) {
    color: #ababab;
}

</style>