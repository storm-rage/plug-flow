<script lang="ts" setup>
import { ref, reactive, onBeforeMount, onUnmounted, onMounted, nextTick, computed  } from 'vue'
import { Icon } from 'tdesign-icons-vue-next'
import type { ListProps } from 'tdesign-vue-next'
import excel from '../../../assets/doc/excel.png';
import flow from '../../../assets/doc/flow.png';
import nav from '../../../assets/doc/nav.png';
import pdf from '../../../assets/doc/pdf.png';
import word from '../../../assets/doc/word.png';
import ppt from '../../../assets/doc/ppt.png';
import loadFailed from '../../../assets/doc/load_failed.png';
import toolimg from '../../../assets/tool/toolimg.png';

import { checkAppInstalled, generateUUID } from './tool';


const props = defineProps(
    { nodeDetail:{ type:Object }, alignRight:{ type:Boolean, default:false} }
)
const emit = defineEmits([
    'docPreview','toolDetail'
])

let isShowToolModule = ref(true)
let isShowDocModule = ref(false)
function handleFold() {
    if(toolsList.length) {
        isShowToolModule.value = !isShowToolModule.value
    }
}
function handleDocFold() {
    if(docsList.value.length){
        isShowDocModule.value = !isShowDocModule.value
    }
}

function sortDocs() {
    //按名称、类型、更新时间排序
    let arr = [...docsList.value]
    arr.sort((a: any, b: any) => {
        const direction = optionSortDirections[docFilter.value] === 'asc' ? 1 : -1
        
        if (docFilter.value === 'name') {
            return a.docName.localeCompare(b.docName) * direction
        } else if (docFilter.value === 'type') {
            return a.docType.localeCompare(b.docType) * direction
        } else if (docFilter.value === 'updateTime') {
            const timeA = new Date(a.lastUpdateTime.replace(' ', 'T')).getTime()
            const timeB = new Date(b.lastUpdateTime.replace(' ', 'T')).getTime()
            return (timeA - timeB) * direction
        }
        return 0
    })
    docsList.value = arr
}
let docFilter = ref('updateTime')
let popupVisible = ref(false)
function handleSelectChange() {
    console.log(docFilter.value)
    sortDocs()
}
function handlePopupChange(value: boolean) {
    popupVisible.value = value
}
let optionSortDirections = reactive<Record<string, 'asc' | 'desc'>>({
  'name': 'asc',
  'type': 'asc',
  'updateTime': 'desc'
})
function handleOptionClick(item: any) {
    console.log('option click===',item,docOptionRef.value)
    optionSortDirections[item.value] = optionSortDirections[item.value] === 'asc' ? 'desc' : 'asc'
    
    // 设置当前选中项
    docFilter.value = item.value
    sortDocs()

}
let docTypes = reactive<any>([
    { label: '名称', value: 'name' },
    { label: '类型', value: 'type' },
    { label: '更新时间', value: 'updateTime' },
])
let toolsList = reactive<any>([])
let docsList = ref<any>([])
onUnmounted(() => {
    toolsList.splice(0, toolsList.length)
    docsList.value.splice(0, docsList.value.length)
    document.addEventListener('click', handleClickOutside)
     hideContextMenu()

    const listContainer = document.querySelector('.docs-list-scrollable')
    if (listContainer) {
        listContainer.removeEventListener('scroll', handleDocsScroll)
        console.log('已移除滚动事件监听器')
    }
})

onMounted(()=> {
      document.addEventListener('click', handleClickOutside)
      
      
    nextTick(() => {
        // 获取 TDesign List 组件的滚动容器
        const listContainer = document.querySelector('.docs-list-scrollable')
        if (listContainer) {
            listContainer.addEventListener('scroll', handleDocsScroll)
            console.log('已绑定滚动事件监听器')
        } else {
            console.warn('未找到 docs-list-scrollable 元素')
        }
    })

})
// 添加用于控制右键菜单的变量
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
let selectedTool = ref<any>(null)
function handleToolRightClick(tool: any, event: any) {
    console.log('handleToolRightClick',tool, event)
    menuList.splice(0, menuList.length)
    event.preventDefault()
    //获取右键菜单
    tool.batch_commands.batch.forEach((item: any) => { 
        if(item.show_in_menu) {
            menuList.push({
                name: item.name,
                uuid: item.uuid,
                command: [...item.commands],
                commandType: item.commands[0].type,
                shortName: item.short_name,
                dragPaths: item.drag_paths ? item.drag_paths : []
            })
        }
    })
  selectedTool.value = tool
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  
  // 先关闭再打开，确保状态正确更新
  contextMenuVisible.value = false
  
  nextTick(() => {
    contextMenuVisible.value = true
  })

}
function handleClickOutside(event: MouseEvent) {
    const toolItems = document.querySelectorAll('.tools-item');
  let clickedOnTool = false;
  
  toolItems.forEach(item => {
    if (item.contains(event.target as Node)) {
      clickedOnTool = true;
    }
  });
  
  if (!clickedOnTool) {
    selectedTool.value = null;
  }

  if (contextMenuVisible.value) {
    // 检查点击是否在菜单外部
    const contextMenu = document.querySelector('.context-menu')
    if (contextMenu && !contextMenu.contains(event.target as Node)) {
      hideContextMenu()
    }
  }
}
function hideContextMenu() {
  contextMenuVisible.value = false
  selectedTool.value = null
  selectedDoc.value = null
}
function handleToolClick(tool: any) {
    selectedTool.value = tool
    selectedDoc.value = null

}

// 处理菜单项点击事件
function handleMenuItemCommand(item: any, index: number) {
  if (!selectedTool.value) return
  console.log(`....`,item,index);
  //todo:发送事件 传递工具数据
  let obj = {
    commandType: item.commandType,
    command: item.command,
    shortName: item.shortName,
    dragPaths: item.dragPaths || [],
    node: item,
    uuid: item.uuid
  }
  console.log(obj)

    handleToolEvent('', obj)
    hideContextMenu()
}
function handleToolEvent(action: string, tool: any) {
    let batch = [], url='', uuid = ''
    if(tool.id) {
        selectedTool.value = tool
        batch = selectedTool.value?.batch_commands?.batch
        url = batch[0]?.commands[0]?.params?.url
    }else {
        uuid = tool.uuid
    }
    console.log('selectedtool==',selectedTool.value)
    
    // let lanuchApp = name?`${name}`:path&&path.includes('next')?`lightbox-next`:'lightbox'
                let lanuchApp = 'lightbox'

    
    if(action) {
        switch (action) {
            case 'run':
                const protocolUrl = `${lanuchApp}://msgtype==toolSharing&&nodeId==${selectedTool.value.id}and${selectedTool.value.parent_id}`
                console.log('run protocolUrl==',protocolUrl)
                checkAppInstalled(protocolUrl,()=>{})

                break;
            case 'toolDetail':
                showDetail.value = true
                emit('toolDetail', selectedTool.value)
                break;
        }
        
          contextMenuVisible.value = false
    } else {
        
        if(url && url.startsWith( 'http')) {
            if ((window as any).electronAPI) {
                (window as any).electronAPI.openExternal(url)
            } else {
                window.open(batch[0].commands[0].params.url, '_blank')
            }

        } else {
            const protocolUrl = `${lanuchApp}://msgtype==toolSharing&&nodeId==${selectedTool.value.id}and${selectedTool.value.parent_id}and${selectedTool.value.parent_id}and${uuid}`
            console.log('protocolUrl==',protocolUrl)
            checkAppInstalled(protocolUrl,
                (isInstalled:any) => {
                    if (isInstalled) {
                    } else {
                    }
                }
            )

        }
        
    }
}
let selectedDoc: any = ref(null)
function handleDocItemClick(item: any) {
    console.log('doc item===',item)
    //打开外部浏览器打开文档url
    if ((window as any).electronAPI) {
        (window as any).electronAPI.openExternal(item.url)
    } else {
        window.open(item.url, '_blank')
    }
    selectedDoc.value = item
    selectedTool.value = null
    // emit('docPreview', item.url)
}
let currentNode = JSON.parse(localStorage.getItem('currentNodeToolDoc') || '{}')

let menuList: any = reactive([])


let docsPage = ref(1)
let docsPageSize = ref(10)
let hasMoreDocs = ref(true)
let isLoadingDocs = ref(false)
const asyncLoadingRadio = ref('load-more');
const loadMore: ListProps['onLoadMore'] = () => {
  asyncLoadingRadio.value = 'loading'
  
  getDocs(true)

};
function handleListScroll() {
    popupVisible.value = false

}
const asyncLoading = computed<ListProps['asyncLoading']>(() => {
  if (asyncLoadingRadio.value === 'loading-custom') {
    return '没有更多数据了';
  }
  return asyncLoadingRadio.value;
});
let isAutoLoading = false
let docOptionRef = ref(null)

function handleDocsScroll(event: Event) {
    const target = event.target as HTMLElement
    const { scrollTop, scrollHeight, clientHeight } = target

    if (scrollHeight - scrollTop - clientHeight < 10) {
        if (hasMoreDocs.value && !isLoadingDocs.value && !isAutoLoading) {
            isAutoLoading = true // 设置自动加载标志
            getDocs(true)
        }
    }

}
function getTools() {
    if(currentNode?.toolDocRows?.toolRows <= 0) return
    let isPlugLocalConfig = sessionStorage.getItem('isPlugLocalConfig')
    let handleVersion = isPlugLocalConfig ? JSON.parse(isPlugLocalConfig) : null;
    let obj = {
        url:`/openapi/v1/core/get-step-tools?debug_version=${handleVersion ? 0 : 1}`,
        data:{
            step_id: Number(currentNode.id),
        }
    };
    (window as any).electronAPI.send('fetch-data',obj)
}
function getDocs(loadMore = false) {
    if(currentNode?.toolDocRows?.docRows <= 0 || isLoadingDocs.value) return
    if (loadMore && !hasMoreDocs.value) return
    
    // 设置加载状态
    isLoadingDocs.value = true
    if (loadMore) {
        asyncLoadingRadio.value = 'loading'
    }
    // 如果不是加载更多（即初次加载或刷新），则重置页码
    if (!loadMore) {
        docsPage.value = 1
        hasMoreDocs.value = true
        // isAutoLoading = false // 重置自动加载标志
    }
    let isPlugLocalConfig = sessionStorage.getItem('isPlugLocalConfig')
    let handleVersion = isPlugLocalConfig ? JSON.parse(isPlugLocalConfig) : null;
    let obj = {
            url:`/openapi/v1/core/plug/get-step-docs?debug_version=${handleVersion ? 0 : 1}`,
            data: {
                "stepId": Number(currentNode.id),
                "page": docsPage.value,
                "pageSize": docsPageSize.value,
                "orderBy": "doc_update_time",
                "orderDesc": true,
            }
    };
    (window as any).electronAPI.send('fetch-data',obj)
}
let currentTab = JSON.parse(localStorage.getItem('currentTab') || '')
let showDetail = ref(false)
onBeforeMount(() => { 
    if(currentTab.id) {
        getTools()
        getDocs()
    }
})
onMounted(()=>{
    (window as any).electronAPI.on('get-step-tools', (res:any) => { 
        if (res.code == 0) {
            console.log('<<<<<<<<<<<<<查询到工具列表===',res)
            const toolsWithUUID = res.result.items.map((tool: any) => ({
                        ...tool,
                        _uuid: tool._uuid || generateUUID()
                    }));
            toolsList.splice(0, toolsList.length, ...(toolsWithUUID || []))
            isShowToolModule.value = res.result.items && res.result.items.length > 0
        }
    });
    if((window as any).electronAPI) {
        (window as any).electronAPI.on('get-step-docs', (res:any) => { 
            try {
                if (res.code == 0) {
                    const docsWithUUID = res.result.record.map((doc: any) => ({
                        ...doc,
                        _uuid: doc._uuid || generateUUID()
                    }));
                    if (docsList.value.length > 0 && docsPage.value > 1 ) {
                        docsList.value.push(...(docsWithUUID || []))
                    } else {
                        docsList.value.splice(0, docsList.value.length, ...(docsWithUUID || []))
                    }
                    console.log('<<<<<<<<<<<<<查询到文档列表===',res,docsList,docsPage.value)
                    
                    // 更新是否还有更多数据的标志
                    hasMoreDocs.value = res.result?.record?.length === docsPageSize.value
                    
                    // 更新文档模块显示状态
                    isShowDocModule.value = (docsPage.value > 1 ? docsList.value.length > 0 : res.result?.record?.length > 0)
                    
                    // 如果成功加载数据，增加页码为下一次加载做准备
                    if (res.result?.record?.length > 0) {
                        docsPage.value++
                    }
                }
            } catch (error) {
                console.error('获取文档数据失败:', error)
                asyncLoadingRadio.value = 'load-more'

            } finally {
                isLoadingDocs.value = false
                isAutoLoading = false
                sortDocs()

                if (hasMoreDocs.value) {
                    asyncLoadingRadio.value = 'load-more'
                } else {
                    asyncLoadingRadio.value = 'loading-custom'
                }
            }
        })
    }
    
})
</script>
<template>
    <div class="node-tool-doc-box">
    <div class="node-tool-doc" :class="{ 'align-right': props.alignRight }"
    @scroll="handleListScroll"

    >
        <div class="node-module">
            <div class="module tool" v-if="toolsList.length">
            <div class="line">
                
                <div class="title">
                    工具
                    <span class="count">                    
                        ({{ toolsList.length }})
                    </span>
                </div>
                <Icon 
                    name="chevron-up" 
                    size="16" 
                    @click="handleFold" 
                    class="icon-fold"
                    style="color: rgba(255,255,255,.4)"
                    :class="{ 'rotated': !isShowToolModule }"
                    />
            </div>
            <Transition name="slide">
                <div class="tools" v-show="isShowToolModule && toolsList.length > 0">
                    <div class="tools-item" 
                    :class="{ 'active': tool._uuid == selectedTool?._uuid }"
                        v-for="(tool) in toolsList" 
                        :key="tool._uuid"
                        @click="handleToolClick(tool)"
                        @contextmenu="handleToolRightClick(tool, $event)"
                        @dblclick="handleToolEvent('run',tool)"
                    >
                        <t-tooltip placement="right-bottom" :show-arrow="false">
                                <template #content>
                                    <div class="">{{ tool.name }}</div>
                                </template>
                                <div class="tool-cont-warp">
                                    <div class="tool-icon">
                                    <img v-if="tool?.icon_url" :src="`https://${tool?.icon_url}`" alt="app-icon" />
                                    <img v-else :src="toolimg" alt="app-icon" />
                                    </div>
                                    <div class="tool-name">{{ tool.name }}</div>
                                </div>
                        </t-tooltip>
                        
                    </div>
                </div>
            </Transition>
            </div>
            <div class="module doc" :class="{ 'doc-shifted': isShowToolModule && toolsList.length > 0 }" v-if="docsList.length">
                <div class="line">
                    
                    <div class="title">文档
                        <span class="count">                    
                            ({{ docsList.length }})
                        </span>
                    </div>
                    <Icon 
                        name="chevron-up"
                        size="16" 
                        @click="handleDocFold"
                        class="icon-fold"
                        style="color: rgba(255,255,255,.4)"
                        :class="{ 'rotated': !isShowDocModule }"
                        />
                </div>
                <Transition name="slide">
                    <div class="docs" v-show="isShowDocModule && docsList.length > 0">
                        <t-list :async-loading="asyncLoading" split @load-more="loadMore"
                         class="docs-list-scrollable">
                            <t-list-item 
                                v-for="(item) in docsList" 
                                :key="item._uuid"         
                                @click="handleDocItemClick(item)"
                                :class="{ 'active': item._uuid == selectedDoc?._uuid }"
                                >
                                    <t-tooltip placement="bottom" :show-arrow="false"> 
                                        <template #content>
                                            <div class="tooltip-name">{{ item.docName }}</div>
                                            <div class="tooltip-source">{{ item.remark }}</div>
                                        </template>
                                        <div class="docs-item"> 
                                            <div class="docs-item-icon">
                                                <img 
                                                    :src="['sheet','form','smartcanvas','smartsheet'].includes(item.docType)? excel
                                                    :['doc','board'].includes(item.docType)? word
                                                    :item.docType == 'pdf' ? pdf 
                                                    :item.docType == 'flowchart' ? flow
                                                    :item.docType == 'mind' ? nav
                                                    :item.docType == 'slide' ? ppt : loadFailed " 
                                                    alt="file-icon"
                                                >
                                            </div>
                                            <div class="docs-item-cont">
                                                <div class="docs-item-title">{{ item.docName }}</div>
                                                <div class="docs-item-desc">{{ item.remark }}</div>
                                            </div>
                                        </div>
                                    </t-tooltip>
                                    
                            </t-list-item>
                        </t-list>
                        <div class="type-select">
                            <span>排序：</span>
                            <div class="select-box">
                                <t-select 
                                ref="docOptionRef"
                                size="small" 
                                v-model="docFilter" 
                                @change="handleSelectChange"
                                :popup-visible="popupVisible"
                                @popup-visible-change="handlePopupChange"
                                :popup-props="{ 
                                        overlayInnerClassName: 'custom-select-popup',
                                        attach: '.node-tool-doc',
                                        placement: 'bottom-left'
                                    }"
                                >
                                    <template #suffixIcon>
                                        <Icon 
                                            :name="docFilter ? (optionSortDirections[docFilter] === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-down'" 
                                            size="16"
                                         />
                                    </template>
                                    <t-option 
                                        v-for="item in docTypes" 
                                        :key="item.value" 
                                        :label="item.label" 
                                        :value="item.value"
                                        @click="handleOptionClick(item)"
                                        >
                                        <div class="option-with-arrow">
                                            <span class="option-label">{{ item.label }}</span>
                                            <Icon 
                                                :name="optionSortDirections[item.value] === 'asc' ? 'arrow-up' : 'arrow-down'" 
                                                size="12" 
                                                class="option-arrow" 
                                            />
                                        </div>
                                    </t-option>
                                </t-select>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
        
    </div>
    </div>
    <!-- <t-dialog 
        v-model:visible="showDetail" 
        header="工具详情" 
        width="60%" 
        class="custome-dialog"
        :footer="false" 
        >
      <div class="detail-cont">
        <div class="tool-icon">
            <div class="icon-tip">图标</div>
            <div class="icon">
                <t-image
                    :src="`https://${selectedTool?.icon_url}`"
                    :style="{ width: '120px', height: '120px' }"
                />
            </div>
        </div>
        <div class="tool-info">
            <div class="tool-info-item">
                <div class="info-title">名称：</div>
                <div class="info-des">{{ selectedTool.name }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">分类：</div>
                <div class="info-des">{{ `${selectedTool.twoCategoryName} / ${selectedTool.stepName}` }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">旗标：</div>
                <div class="info-des">{{ selectedTool.flag_content || '无' }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">标签：</div>
                <div class="info-des">
                    <t-tag>{{ selectedTool.label[0] || '无' }}</t-tag>
                </div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">应用简介：</div>
                <div class="info-des">{{ selectedTool.description }}</div>
            </div>
            <div class="line"></div>
            <div class="tool-info-item">
                <div class="info-title">创建者：</div>
                <div class="info-des">{{ selectedTool.creator }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">创建时间：</div>
                <div class="info-des">{{ selectedTool.created_date }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">更新时间：</div>
                <div class="info-des">{{ selectedTool.updated_date }}</div>
            </div>

        </div>
      </div>
    </t-dialog> -->
    <teleport to="body">
        <div 
            v-if="contextMenuVisible"
            class="context-menu-overlay"
            @click="hideContextMenu"
            >
                <div 
                    class="context-menu"
                    :style="{
                    position: 'fixed',
                    left: contextMenuPosition.x + 'px',
                    top: contextMenuPosition.y + 'px',
                    zIndex: 9999
                    }"
                    @click.stop
                    >
                        <div class="context-menu-item" @click="handleToolEvent('run',{})">
                            <span class="option-name">运行</span>
                        </div>
                        <div class="seprate-line"></div>
                        <div class="context-menu-item" @click="handleToolEvent('toolDetail', {})">
                            <span class="option-name">详情</span>
                        </div>
                        <div class="seprate-line" v-if="menuList.length"></div>
                        <div class="menu-extra" v-if="menuList.length">
                            <div 
                                v-for="(item, index) in menuList"
                                :key="item.id"
                                class="menu-extra-item"
                                @click="handleMenuItemCommand(item,index)"
                                >
                                <span class="option-name">{{item.name}}</span>
                            </div>
                        </div>
                    </div>
            </div>
    </teleport>

</template>
<style lang="less" scoped>
.node-tool-doc{
    width: 538px;
    min-height: 360px;
    max-height: 600px;
    background: #313131;
    border-radius: 10px;
    overflow-y: scroll;
    &::before {
        content: '';
        position: absolute;
        top: -10px;
        left: 60px;
        width: 20px;
        height: 20px;
        background: #313131;
        transform: rotate(45deg);
        border-radius: 5px 0 0 0;
        z-index: 99;
        border-top: 1px solid rgba(255, 255, 255, .2);
        border-left: 1px solid rgba(255, 255, 255, .2);
    }
     &.align-right::before {
        left: auto;
        right: 60px;
    }
    .node-module {
        height: 100%;
        .module{
            margin-right: 10px;
            .icon-fold {
                cursor: pointer;
                transition: transform 0.3s ease;
                &.rotated {
                    transform: rotate(-180deg);
                }
            }
            .line {
                display: flex;
                align-items: center;
                // justify-content: center;
                height: 30px;
                .title {
                    min-width: 80px;
                    font-size: 18px;
                    padding-right: 10px;
                    text-align: left;
                    .count {
                        margin-left: 10px;
                    }
                    .circle {
                        display: inline-block;
                        width: 4px;
                        height: 4px;
                        line-height: 4px;
                        border-radius: 50%;
                        background: #fff;
                        margin: 0 10px 2px 10px;
                    }
                }
                .top-line {
                    flex: 1;
                    height: 1px;
                    background-color: rgba(255,255,255,0.1);
                }
            }
            .tools {
                min-height: 10px;
                display: flex;
                flex-wrap: wrap;
                .tools-item {
                    width: 82px;
                    padding: 8px;
                    margin: 2px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    &:hover { 
                        background-color: rgba(255,255,255,.06);
                        border: 1px solid rgba(4, 135, 249, 0);
                        border-radius: 8px;
                    }
                }
            }
            .docs {
                min-height: 10px;
                position: relative;
            }
            
        }
        .doc {
            transition: transform 0.3s ease-in-out;
            &.doc-shifted {
                transform: translateY(20px);
            }
        }
    }
    
}
.tool-cont-warp { 
    width: 82px;
    padding: 8px;
    margin: 2px;
    cursor: pointer;
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    align-items: center;

    .tool-icon { 
        width: 68px;
        height: 68px;
        img {
            width: 100%;
            height: 100%;
            border-radius: 14px;
        }
    }
    .tool-name {
        width: 100%;
        text-align: center;
        font-size: 14px;
        margin-top: 6px;
        line-height: 22px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

.detail-cont {
    display: flex;
    .tool-icon {
        width: 120px;
        text-align: left;
        margin: 40px;
    }
    .tool-info {
        flex: 1;
        padding: 0 20px;
        .tool-info-item {
            display: flex;
            text-align: left;
            margin: 4px 0;
            .info-title {
                width: 100px;
            }
            .info-des {
                flex: 1;
            }
        }
        .line {
            height: 2px solid #ababab;
            margin: 10px 0;
        }
    }
    
}
.custome-dialog {
    background-color: #1f1f1f!important;
}
.active {
    background-color: rgba(255,255,255,.06);
    border-radius: 5px;
}
::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
}
::-webkit-scrollbar {
    width: 6px;
}

.docs-item {
    display: flex;
    // height: 60px;
    align-items: center;
    // border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    .docs-item-icon {
        width: 60px;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        img {
            width: 36px;
            height: 36px;
        }
    }
    .docs-item-cont { 
        flex: 1;
        text-align: left;
        .docs-item-title {
            font-size: 12px;
            font-weight: 500;
        }
        .docs-item-desc {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 6px;
        }
    }
}

.type-select {
    width: 140px;
    position: absolute;
    right: 0;
    top: -26px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: rgba(255, 255, 255, 0.5);
    .select-box {
        width: 90px;
        
    }
}
.t-list {
    color: rgba(255, 255, 255, 0.5);
    background-color: transparent;
}

:deep(.t-is-selected) {
    background-color: rgba(255,255,255,.06);
}
:deep(.t-list--split .t-list-item:after) {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
}
:deep(.t-list-item) {
    cursor: pointer;
    padding: 0;
    &:hover { 
        background-color: rgba(255,255,255,.06);
        border-radius: 8px;
    }
}
:deep(.t-list-item-main) {
    justify-content: left;
    padding: 16px 0;
    .docs-item-icon {
        width: 40px;
        height: 40px;
        margin: 0 12px 0 8px;
        img {
            width: 100%;
            height: 100%;
        }
    }
    .docs-item-cont {
        text-align: left;
        width: calc(100% - 60px);
        .docs-item-title {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .docs-item-desc {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.3);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}
:deep(.t-list__load) {
    background-color: transparent;
    cursor: pointer;
    font-size: 12px;
}
:deep(.t-input.t-is-readonly){
    background-color: rgba(0, 0, 0, 0.05);
}

:deep(.t-select__dropdown-inner--size-s .t-select__list, .t-select__dropdown-inner--size-s .t-tree) {
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 8px;
}

.t-select {
    .t-popup__content {
        background-color: #37383b !important;
        .t-select__dropdown-inner--size-s {
            .t-select__list {
                .t-select-option {
                    color: #fff;
                    &:hover { 
                        background-color: #3484ea;
                    }
                }
                .t-select-option.t-is-selected:not(.t-is-disabled) {
                    background-color: rgba(52, 132, 234, 0.3);
                    color: #fff;
                    &:hover {
                        background-color: #3484ea;
                    }
                }
            }
        }
    }
}

.tooltip-name {
    font-size: 12px;
    font-weight: 500;
}
.tooltip-source { 
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 6px;
}
:deep(.t-select__dropdown) {
    background-color: #37383b;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 8px;
}

:deep(.t-select-option) {
    color: #fff;
    background-color: #37383b;
    
    &:hover {
        background-color: rgba(52, 132, 234, 0.2); /* 悬停时的背景色 */
    }
    
    &.t-is-selected {
        background-color: rgba(52, 132, 234, 0.3); /* 选中项的背景色 */
        color: #fff;
    }
}

:deep(.t-select__dropdown-wrapper) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.slide-enter-from {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 300px;
  opacity: 1;
}

.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
.option-with-arrow {
    display: flex;
    align-items: center;
    .option-label {
        display: inline-block;
        min-width: 60px;
    }
}

// 添加上下文菜单样式
.context-menu {
    background-color: rgba(62,63,67, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(20px);
//   border: 1px solid rgba(19, 19, 19, 0.8);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 120px;
  padding: 8px 0;
  
  .context-menu-item {
    display: flex;
    align-items: center;
    padding: 8px;
    // border-radius: 4px 4px 0 0;
    font-size: 12px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    .option-name {
        margin-left: 8px;
    }
    
    &:hover {
      background: #3484ea;
      color: white;
    }
    
    i {
      margin-right: 8px;
    }
  }
  
}
.bottom-line {
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}
.seprate-line {
    height: 1px;
    margin: 4px 10px;
    background-color: rgba(255,255,255,.06);
  }
.menu-extra {
    // padding: 8px 0;
    // border-radius: 4px 4px 0 0;
    font-size: 12px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    flex-direction: column;
    .menu-extra-item {
        padding: 8px;
        margin: 0 2px;
        .option-name {
            margin-left: 8px;
        }
        &:hover {
            // background: rgba(117, 117, 117, .3);
            background: #3484ea;
            color: white;
        }
    }

}
.context-menu-overlay {
    background: transparent;
    &::before {
    background: linear-gradient(180deg, #28282850 0%, #22222250 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}
</style>
<style lang="less">
.custom-select-popup {
  background-color: #37383b !important;
  border-radius: 8px !important;
  .t-select__dropdown {
    background-color: #37383b !important;
  }
  .t-select-option {
    color: #fff !important;
    background-color: #37383b !important;
    
    &:hover {
      background-color: #3484ea !important;
    }
    
    &.t-is-selected {
      background-color: #3484ea !important;
      color: #fff !important;
    }
  }
}
</style>