<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from 'tdesign-icons-vue-next'
import EmptyImgSrc from '../../../assets/empty.png';
import excel from '../../../assets/doc/excel.png';
import flow from '../../../assets/doc/flow.png';
import nav from '../../../assets/doc/nav.png';
import pdf from '../../../assets/doc/pdf.png';
import word from '../../../assets/doc/word.png';
import ppt from '../../../assets/doc/ppt.png';
import loadFailed from '../../../assets/doc/load_failed.png';
import toolimg from '../../../assets/tool/toolimg.png';
import { checkAppInstalled, generateUUID } from './tool';



const router = useRouter();
let docTypes = reactive<any>([
    { label: '名称', value: 'name' },
    { label: '类型', value: 'type' },
    { label: '更新时间', value: 'updateTime' },
])
let toolsList = ref<any>([])
let docsList = ref<any>([])
let keyword = ref('updateTime')
function handleBack() {
    (window as any).electronAPI?.send('clear-keyvalue');

    router.push('/')
}
function handleSelectChange() {
    console.log(keyword.value)
    
}

onMounted(() => { 
    document.addEventListener('click', handleClickOutside);
    if((window as any).electronAPI) {
        (window as any).electronAPI.on('global-search', (res:any) => { 
            if (res.code == 0) {
                console.log('<<<<<<<<<<<<<查询到全局搜索的结果===',res)
                const toolsWithUUID = res.result.tools.map((tool: any) => ({
                    ...tool,
                    _uuid: tool._uuid || generateUUID()
                }))
                const docsWithUUID = res.result.documents.map((doc: any) => ({
                    ...doc,
                    _uuid: doc._uuid || generateUUID()
                }));
                toolsList.value.splice(0, toolsList.value.length, ...toolsWithUUID)
                docsList.value.splice(0, docsList.value.length, ...docsWithUUID)
                sortTools()
                sortDocs()
                loading.value = false
            }
        })
    }
    

})
onUnmounted(() => {
    
    document.removeEventListener('click', handleClickOutside)
     hideContextMenu()
})
let selectedDoc: any = ref(null)
function handleDocItemClick(item: any) {
    console.log('doc item===',item)
    selectedDoc.value = item
    if ((window as any).electronAPI) {
        (window as any).electronAPI.openExternal(item.url)
    } else {
        window.open(item.url, '_blank')
    }
    return
    handleDocPreview(item.url)
}
let docPreview = ref(false)
let docPreviewDetail = ref<any>({
  url: '',
})
function handleDocPreview(url : string) {
  console.log('回调文档信息 ===',url)
  docPreviewDetail.value.url = url
  docPreview.value = true
}
let isElectron = (window as any)?.ElectronAPI?.isElectron
const hasResults = computed(() => {
    return (toolsList.value.length + docsList.value.length) > 0
})
let optionSortDirections = reactive<Record<string, 'asc' | 'desc'>>({
  'name': 'asc',
  'type': 'asc',
  'updateTime': 'desc'
})
function handleOptionClick(item: any) {
    console.log('option click===',item)
    optionSortDirections[item.value] = optionSortDirections[item.value] === 'asc' ? 'desc' : 'asc'
    
    keyword.value = item.value

    sortTools()
    sortDocs()
}
function sortTools() {
    if (!toolsList.value || !toolsList.value.length) return []
  
  const direction = optionSortDirections[keyword.value] === 'asc' ? 1 : -1
    toolsList.value.sort((a: any, b: any) => {
        if (keyword.value === 'name') {
            const nameComparison = a.name.localeCompare(b.name) * direction
            return nameComparison !== 0 ? nameComparison : a._uuid.localeCompare(b._uuid)
        } else if (keyword.value === 'updateTime') {
            const timeA = new Date(a.updated_date.replace(' ', 'T')).getTime()
            const timeB = new Date(b.updated_date.replace(' ', 'T')).getTime()
            const timeDifference = (timeA - timeB) * direction
            return timeDifference !== 0 ? timeDifference : a._uuid.localeCompare(b._uuid)
        }
        return a._uuid.localeCompare(b._uuid)
    })
}
function sortDocs() {
    if(!docsList.value.length) return []
    return docsList.value.sort((a: any, b: any) => {
        const direction = optionSortDirections[keyword.value] === 'asc' ? 1 : -1
        
        if (keyword.value === 'name') {
            const nameComparison = a.docName.localeCompare(b.docName) * direction
            return nameComparison !== 0 ? nameComparison : a._uuid.localeCompare(b._uuid)
        } else if (keyword.value === 'type') {
            const typeComparison = a.docType.localeCompare(b.docType) * direction
            return typeComparison !== 0 ? typeComparison : a._uuid.localeCompare(b._uuid)
        } else if (keyword.value === 'updateTime') {
            const timeA = new Date(a.lastUpdateTime.replace(' ', 'T')).getTime()
            const timeB = new Date(b.lastUpdateTime.replace(' ', 'T')).getTime()
            const timeDifference = (timeA - timeB) * direction
            return timeDifference !== 0 ? timeDifference : a._uuid.localeCompare(b._uuid)
        }
        return a._uuid.localeCompare(b._uuid)
    })
}

let menuList: any = reactive([])

let showDetail = ref(false)
function handleToolRightClick(tool: any, event: any) {
    menuList.splice(0, menuList.length)
    event.preventDefault()
    tool.batch_commands.batch.forEach((item: any) => { 
        if(item.show_in_menu) {
            menuList.push({
                name: item.name,
                command: [...item.commands],
                commandType: item.commands[0].type,
                shortName: item.short_name,
                uuid: item.uuid,
                dragPaths: item.drag_paths ? item.drag_paths : []
            })
        }
    })
  selectedTool.value = tool
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  
  contextMenuVisible.value = false
  
  nextTick(() => {
    contextMenuVisible.value = true
  })

}
function handleToolClick(tool: any) {
    selectedTool.value = tool
}
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
let selectedTool = ref<any>(null)
function handleToolEvent(action: string, tool: any) {
    // let batch = [], url='', uuid = ''
    console.log('action===',window)
    let uuid = ''
    if(tool.id) {
         selectedTool.value = tool
        // batch = selectedTool.value?.batch_commands?.batch
        // url = batch[0]?.commands[0]?.params?.url
    } else {
        uuid = tool.uuid
    }
    contextMenuVisible.value = false
    if(action) {
        console.log('~~~~~~',selectedTool.value)
        showDetail.value = true
    } else {
        let batch = selectedTool.value?.batch_commands?.batch
        let url = batch[0]?.commands[0]?.params?.url
        if(url && url.startsWith( 'http')) {
            if ((window as any).electronAPI) {
                (window as any).electronAPI.openExternal(url)
            } else {
                window.open(batch[0].commands[0].params.url, '_blank')
            }

        } else {
            

            // let lanuchApp = name?`${name}`:path&&path.includes('next')?`lightbox-next`:'lightbox'
            let lanuchApp = 'lightbox'

            const protocolUrl = `${lanuchApp}://msgtype==toolSharing&&nodeId==${selectedTool.value.id}and${selectedTool.value.parent_id}and${selectedTool.value.parent_id}and${uuid}`
            console.log('protocolUrl==',protocolUrl)
            checkAppInstalled(protocolUrl,
                (isInstalled:any) => {
                    if (isInstalled) {
                    // console.log("应用已安装");
                    } else {
                    // console.log("应用未安装");
                    }
                }
            )
        }
        
    }
}
function hideContextMenu() {
  contextMenuVisible.value = false
  selectedTool.value = null
}
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
function handleClickOutside(event: MouseEvent) {
    const clickedToolItem = (event.target as Element).closest('.tools-item')
  
  // 如果点击的不是工具项，则清除选中状态
  if (!clickedToolItem && selectedTool.value) {
    selectedTool.value = null
  }

  if (contextMenuVisible.value) {
    // 检查点击是否在菜单外部
    const contextMenu = document.querySelector('.context-menu')
    if (contextMenu && !contextMenu.contains(event.target as Node)) {
      hideContextMenu()
      hideContextMenuDev()
    }
  }
}
let loading = ref(false)


const contextMenuVisibleDev = ref(false)
const contextMenuPositionDev = reactive({ x: 0, y: 0 })
function handlePaneContextMenu(event: MouseEvent) {
  event.preventDefault()
  
  // 设置右键菜单位置
  contextMenuPositionDev.x = event.clientX
  contextMenuPositionDev.y = event.clientY
  
  // 显示右键菜单
  contextMenuVisibleDev.value = true
}

function hideContextMenuDev() {
  contextMenuVisibleDev.value = false
}
function openDevTools() {
  // 通过 electronAPI 打开开发者工具
  if ((window as any).electronAPI?.send) {
    (window as any).electronAPI?.send('open-dev-tools')
  }
  hideContextMenuDev()
}
onMounted(() => {
  // 添加全局点击监听器来隐藏右键菜单
  const handleClickOutsideDev = (event: MouseEvent) => {
    if (contextMenuVisibleDev.value) {
      const contextMenu = document.querySelector('.context-menu-dev')
      if (contextMenu && !contextMenu.contains(event.target as any)) {
        hideContextMenuDev()
      }
    }
  }
  
  document.addEventListener('click', handleClickOutsideDev)  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutsideDev)
  })
})
</script>
<template>
    <div class="query-tool-doc"
    @contextmenu.prevent="handlePaneContextMenu"
    >
        <div class="top-bar">
            <div class="left" @click="handleBack">
                <icon name="chevron-left" class="icon-arrow-left"/>
                返回
            </div>
            <div class="right">
                <div class="type-select">
                    <span>搜索结果（{{toolsList.length + docsList.length}}）</span>
                    <span class="select-text">排序：</span>
                    <div class="select-box">
                        <t-select size="small" v-model="keyword" @change="handleSelectChange"
                        :popup-props="{ 
                                overlayInnerClassName: 'custom-select-popup',
                                attach: '.node-tool-doc',
                                placement: 'bottom-left'
                            }"
                        >
                                    <template #suffixIcon>
                                        <Icon 
                                            :name="keyword ? (optionSortDirections[keyword] === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-down'" 
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
        </div>
        <t-loading :loading="loading" text="加载中..." />

        <div class="query-result" v-if="hasResults" >
            <div class="line" v-if="toolsList.length > 0">
                    <div class="title">工具
                        <span class="count">                    
                            ({{ toolsList.length }})
                        </span>
                    </div>
            </div>
            <div class="tools" v-if="toolsList.length > 0">
                <div 
                    class="tools-item" 
                    v-for="(tool) in toolsList" 
                    :key="tool._uuid"
                    :class="{ 'active': tool._uuid == selectedTool?._uuid }"
                    @click="handleToolClick(tool)"
                    @contextmenu.stop="handleToolRightClick(tool, $event)"
                    @dblclick="handleToolEvent('',tool)"
                    >
                        <t-tooltip placement="right-bottom" :show-arrow="false">
                            <template #content> 
                                <div class="tooltip-name">{{ tool.name }}</div>
                                <div class="tooltip-source">{{ `${tool.twoCategoryName}-${tool.stepName}` }}</div>
                            </template>
                            <div class="tool-cont-warp">
                                <div class="tool-icon">
                                    <img v-if="tool?.icon_url" :src="`https://${tool.icon_url}`" alt="app-icon"/>
                                    <img v-else :src="toolimg" alt="app-icon" />
                                </div>
                                <div class="tool-name">{{ tool.name }}</div>
                                <div class="item-source tool-source">{{ `${tool.twoCategoryName}-${tool.stepName}` }}</div>
                            </div>
                        </t-tooltip>
                </div>
            </div>
            <div class="line" v-if="docsList.length > 0">
                    <div class="title">文档
                        <span class="count">                    
                            ({{ docsList.length }})
                        </span>
                    </div>
            </div>
            <div class="docs" v-if="docsList.length > 0">
                <div class="docs-list">
                    <div 
                        class="docs-item" 
                        v-for="(item) in docsList" 
                        :key="item._uuid"
                        :class="{ 'active': item._uuid == selectedDoc?._uuid }"
                        @click="handleDocItemClick(item)"
                        >
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
                            <div class="docs-item-info">
                                <div class="docs-item-title">{{ item.docName }}</div>
                                <div class="docs-item-desc">{{ item.remark }}</div>
                            </div>
                            <div class="item-source">{{ `${item.twoCategoryName}-${item.stepName}` }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="query-result query-result-empty" v-if="!hasResults && !loading">
            <div class="text">暂无搜索结果</div>
            <img :src="EmptyImgSrc" alt="empty" />
        </div>
        
    </div>
    <teleport to="body">
        <div 
        v-if="contextMenuVisibleDev"
        class="context-menu-overlay"
        @click="hideContextMenuDev"
        >
        <div 
            class="context-menu context-menu-dev"
            :style="{
            position: 'fixed',
            left: contextMenuPositionDev.x + 'px',
            top: contextMenuPositionDev.y + 'px',
            zIndex: 9999
            }"
            @click.stop
        >
            <div class="context-menu-item" @click="openDevTools">
            <span class="option-name">打开开发者工具</span>
            </div>
        </div>
        </div>
    </teleport>
    <t-dialog 
        v-model:visible="showDetail" 
        header="工具详情" 
        width="60%" 
        class="custome-dialog"
        :footer="false" 
        @click.stop
        >
      <div class="detail-cont">
        <div class="tool-icon">
            <div class="icon-tip">图标</div>
            <div class="icon">
                <t-image v-if="selectedTool?.icon_url"
                    :src="`https://${selectedTool.icon_url}`"
                    :style="{ width: '120px', height: '120px' }"
                />
                <t-image v-else
                    :src="toolimg"
                    :style="{ width: '120px', height: '120px' }"
                />
            </div>
        </div>
        <div class="tool-info" v-if="selectedTool">
            <div class="tool-info-item">
                <div class="info-title">名称：</div>
                <div class="info-des">{{ selectedTool?selectedTool.name:'' }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">分类：</div>
                <div class="info-des">{{ `${selectedTool?selectedTool.twoCategoryName:''} / ${selectedTool?selectedTool.stepName:''}` }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">旗标：</div>
                <div class="info-des">{{ selectedTool?selectedTool.flag_content : '无' }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">标签：</div>
                <div class="info-des">
                    <t-tag>{{ selectedTool?selectedTool.label[0] : '无' }}</t-tag>
                </div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">应用简介：</div>
                <div class="info-des">{{ selectedTool?selectedTool.description:'' }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">创建者：</div>
                <div class="info-des">{{ selectedTool?selectedTool.creator:'' }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">创建时间：</div>
                <div class="info-des">{{ selectedTool?selectedTool.created_date:'' }}</div>
            </div>
            <div class="tool-info-item">
                <div class="info-title">更新时间：</div>
                <div class="info-des">{{ selectedTool?selectedTool.updated_date:'' }}</div>
            </div>

        </div>
      </div>
    </t-dialog>
    <t-drawer v-model:visible="docPreview" placement="right" size="80%" :footer="false">
      <template #header>{{ docPreviewDetail.url }}</template>
      <webview 
        v-if="isElectron"
        :src="docPreviewDetail.url"
        style="width:100%; height:calc(100% - 60px);"
        autosize="on"
      ></webview>
      <iframe v-else
        :src="docPreviewDetail.url"
        frameborder="0"
        style="width:100%;height:100%;border:none;"
      ></iframe>
    </t-drawer>
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
                        <div class="context-menu-item" @click="handleToolEvent('',selectedTool)">
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
.query-tool-doc {
    height: 100%;
}
.query-result {
    height: calc(100% - 60px);
    overflow-y: scroll;
    margin-left: 40px;
    padding-right: 40px;
    
}
.query-result-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    img {
        width: 80px;
        height: 80px;
    }
}
::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
}
::-webkit-scrollbar {
    width: 6px;
}
.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 42px 20px 40px;
    font-size: 14px;
    color: rgba(255,255,255,.6);
}
.left {
    cursor: pointer;
}
.right {
    .type-select { 
        display: flex;
        align-items: center;
    }
}
.tools {
    display: flex;
    flex-wrap: wrap;
}
.tools-item {
    width: 96px;
    height: 156px;
    padding: 12px 8px;
    margin: 4px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    &:hover { 
        background-color: rgba(255,255,255,.06);
        border-radius: 5px;
    }
}
.active { 
    background-color: rgba(255,255,255,.06);
    border-radius: 5px;
}
.tool-cont-warp {
    width: 96px;
    height: 156px;
    // padding: 12px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    .tool-icon { 
        width: 80px;
        height: 80px;
            img {
                width: 100%;
                height: 100%;
                border-radius: 10px;
            }
    }
    .tool-name {
        width: 100%;
        text-align: center;
        font-size: 16px;
        padding: 4px;
        margin: 12px 0 16px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
.tooltip-name {
    font-size: 16px;
}
.tooltip-source { 
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
}
.docs {
    .docs-list {
        padding-top: 24px;
        .docs-item {
            cursor: pointer;
            display: flex;
            height: 60px;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            &:hover {
                background: rgba(255, 255, 255, 0.06);
                border-radius: 8px;
            }
            .docs-item-icon {
                width: 40px;
                height: 40px;
                margin-right: 12px;
                img {
                    width: 100%;
                    height: 100%;
                }
            }
            .docs-item-cont { 
                flex: 1;
                text-align: left;
                display: flex;
                align-items: center;
                .docs-item-info {
                    margin-right: 16px;
                    .docs-item-title {
                        font-size: 14px;
                        font-weight: 500;
                    }
                    .docs-item-desc {
                        font-size: 12px;
                        color: rgba(255, 255, 255, 0.5);
                        margin-top: 4px;
                    }
                }
            }
        }
    }
}
.item-source {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    background-color: rgba(255,255,255,.06);
    padding: 2px 8px 0 8px;
    border-radius: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.tool-source {
    width: calc(100% - 16px);
}
.type-select {
    // width: 240px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: rgba(255, 255, 255, 0.5);
    .select-text {
        margin: 0 8px 0 12px;
    }
    .select-box {
        width: 90px;
        --td-select-options-background-color: #37383b;

    }
}
.option-with-arrow {
    display: flex;
    align-items: center;
    .option-label {
        display: inline-block;
        min-width: 60px;
    }
}
:deep(.t-input.t-is-readonly) {
    background-color: rgba(0, 0, 0, 0.05);
}
.line {
    height: 40px;
    display: flex;
    align-items: center;
    // margin-top: 32px;
    .title {
        font-size: 18px;
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
// 添加上下文菜单样式
.context-menu {
    background: linear-gradient(180deg, #282828 0%, #222222 100%);
  border: 1px solid rgba(19, 19, 19, 0.8);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 120px;
//   padding: 8px 0;
  
  .context-menu-item {
    display: flex;
    align-items: center;
    padding: 8px;
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
  background: transparent;
    &::before {
    background: linear-gradient(180deg, #28282850 0%, #22222250 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
}

.detail-cont {
    display: flex;
    .tool-icon {
        width: 120px;
        text-align: left;
        margin: 0 40px 0 20px;
        .icon-tip {
          margin-bottom: 10px;
        }
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
:deep(.t-popup__content) {
    background-color: #37383b;
}

</style>