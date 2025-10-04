<script setup lang="ts">
import { onBeforeMount, reactive, ref, computed, onMounted } from "vue";
import { SearchIcon } from 'tdesign-icons-vue-next';
import Peace from '../../assets/peace.png';
import PhotonLogo from '../../assets/photon-logo1.png';
import TopBar from "./topBar/index.vue"
import type { InputProps } from 'tdesign-vue-next';
import { useRouter } from 'vue-router'
import { debounce } from "lodash";
import tabTree from '../views/components/tabTree.vue';


const electronAPI = (window as any).electronAPI;

const router = useRouter()
export interface TabItem {
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
let tabsTopNest = computed(() => { 
  // return tabsTop[activeTabTop.value]?.child
  return [
    {
      id: '1',
      name: 'step1',
      index: 0,
      child: [
        {
          id: '1-1',
          name: 'step1-1',
          index: 0,
          child: [
            {
              id: '1-1-1',
              name: 'step1-1-1',
              index: 0
            }
          ]
        },
        {
          id: '1-2',
          name: 'step1-2',
          index: 1
        }
      ]
    },
    {
      id: '2',
      name: 'step2',
      index: 1,
      child: [
        {
          id: '2-1',
          name: 'step2-1',
          index: 0
        },
        {
          id: '2-2',
          name: 'step2-2',
          index: 1
        }
      ]
    }
  ]
});
let activeTabTop = ref(0);
let activeTab = ref(0);

const debouncedHandleTabsTopClick  = debounce((tab:any,index:any) => { 
  if (tab?.id !== undefined && tab?.id !== null && electronAPI?.send) {
      electronAPI.send('update-location');
    }
    isTabClick.value = true
  const selectedTab = tabsTop[index]
  if (selectedTab) {
    setTimeout(() => {
    activeTabTop.value = index
    }, 0);
    let childTab = tabsTop[index].child
    if (Array.isArray(childTab) && childTab.length > 0) {
      tabs.splice(0, tabs.length, ...childTab)

      let cachedTabIndex = 0;
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
}, 1000, { leading: true , trailing: false });
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
}, 1000, { leading: true , trailing: false });

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
  electronAPI.on('file-upload-error',(res:any) => {
    console.error('file-upload-error',res)
    if(loading.value) {
      loading.value = false
    }
    electronAPI.invoke('aegis-call', { 
      method: 'error',
      args: ['file-upload-error', { 
        data: res,
      }]
     });
  });
  electronAPI.on('request-failed',(res:any) => {
    console.error('request-failed',res)
    electronAPI.invoke('aegis-call', { 
      method: 'error',
      args: ['request failed', { 
        data: res,
      }]
     });
  });
  electronAPI.on('request-data',(res:any) => {
    console.log('request-data',res)
    electronAPI.invoke('aegis-call', { 
      method: 'reportEvent',
      args: ['request data', { 
        data: res,
      }]
     });
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

function openWorkWechatContact() {
  if (!contactPerson.value) return;
  try {
    // 构造联系人信息对象
    const contactInfo = {
      name: contactPerson.value,
      email: '', // 如果有邮箱信息可以添加
      userId: '', // 如果有企业微信用户ID可以添加
      kfId: '' // 如果有客服ID可以添加
    };
    electronAPI?.send('open-work-wechat-contact', contactInfo);
    console.log('发送打开企业微信请求成功', contactInfo);
  } catch (error) {
    console.error('发送打开企业微信请求失败:', error);
  }
}
const BG_COLORS = ['#23D0A1', '#777777', '#F86332', '#9853FF', '#00B5EE', '#9FB817'];
let spaceBg = computed(()=> {
  return BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)]
})
let spaceName = computed(()=> {
  console.log('spaceName',(window as any).electronAPI?.env)
  return (window as any).electronAPI?.env.SPACE_NAME || '未知空间名'
})
let spaceLogo = computed(()=> {
  return (window as any).electronAPI?.env.SPACE_LOGO || ''
})
let tabTreeRef = ref<HTMLElement | null>(null);


</script>
<template>
  <top-bar/>
  <div class="main">
    <div class="container">
      <div class="left">
          <div class="logo">
            <img v-if="Peace" :src="Peace" alt="Peace"></img>
            <img v-else-if="spaceLogo" :src="spaceLogo" alt="Peace"></img>
            <div v-else class="logo-bg" :style="{backgroundColor: spaceBg}">{{spaceName[0]}}</div>
          </div>
          <div class="title">{{ title || spaceName}}</div>
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
    <div v-if="false"
    ref="tabTreeRef">
      <tab-tree 
        :tabs="tabsTopNest || []" 
        :active-tab="activeTab"
        @tab-click="handleTabsClick"
      />
    </div>
    <div class="content" :style="{ height: `calc(100% - 50px - ${tabTreeRef?.offsetHeight || 0}px)` }">
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
    bottom: -100px;
    pointer-events: none;
    position: fixed;
    right: -200px;
    z-index: 99;
    width: 680px;
    img {
      opacity: .15;
      width: 100%;
    }
}
.main {
  position: relative;
  top: 52px;
  height: calc(100% - 64px);
}
.container {
  padding: 0 40px;
  line-height: 61px;
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
      line-height: 30px;
      img {
        width: 100%;
        height: 100%;
      }
      .logo-bg {
        width: 100%;
        height: 100%;
        line-height: 30px;
        border-radius: 6px;
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
              color: var(--primary-color-hover);
              font-weight: 600;
              border-bottom: 1px solid var(--primary-color-hover);
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
              color: var(--primary-color-hover);
              font-weight: 600;
              border-bottom: 1px solid var(--primary-color-hover);
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
        color:  var(--primary-color-hover);
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
  --td-brand-color: var(--primary-color-hover); /* 设置品牌色，会影响焦点边框 */
  border-color: var(--primary-color-hover) !important;
  box-shadow: 0 0 0 2px rgba(2, 157, 229, 0.2) !important;
}
:deep(.t-input:hover) {
  border-color: var(--primary-color-hover) !important;
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
  border-top: 1px solid rgba(255, 255, 255, .05);
  margin-top: 20px
}
:deep(.t-dialog__header .t-dialog__header-content) {
    color: #ababab;
}
:deep(.t-dialog__close) {
    color: #ababab;
}
:deep(.t-dialog__header .t-dialog__header-content) {
  display: block!important;
  padding-left: 24px!important;
}
:deep(.t-dialog__footer) {
  text-align: center!important;
}
:deep(.t-button--variant-base.t-button--theme-primary) {
  background-color: #3489F6;
  border-color: #3489F6;
}

</style>