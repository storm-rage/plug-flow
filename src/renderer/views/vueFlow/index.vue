<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, onBeforeMount, nextTick, computed, watch } from 'vue'
import type { Node, Edge, Connection, EdgeUpdateEvent } from '@vue-flow/core'  
import { VueFlow, useVueFlow, Position, MarkerType  } from '@vue-flow/core'
import toolimg from '../../../assets/tool/toolimg.png';
import error from '../../../assets/svg/error.svg'
import CustomNode from '../components/customNode.vue'
import SpecialNode from '../components/specialNode.vue'
import SpecialEdge from '../components/specialEdge.vue'
import toolAndDoc from '../components/toolAndDoc.vue'
import { debounce, throttle } from 'lodash';
const nodes = ref<Node[]>([
])
const edges = ref<Edge[]>([
  
])
let dialogVisible = ref(false)
interface NodeToolDoc { 
  id: any,
  name: string,
  type: string,
  data: any,
  position: any,
  style: any,
  tools: any[],
  docs: any,
  sourcePosition: string,
  targetPosition: string,
  class: string,
  selected: boolean,
  draggable: boolean,
  connectable: boolean,
  deletable: boolean,
  dragHandle: string,
  dragPreview: boolean,
  toolDocRows: any,
}
let currentNodeToolDoc = reactive<NodeToolDoc>({
  id: '',
  name: '',
  type: '',
  data: {},
  position: {},
  style: {},
  tools: [],
  docs: [],
  sourcePosition: '',
  targetPosition: '',
  class: '',
  selected: false,
  draggable: false,
  connectable: false,
  deletable: false,
  dragHandle: '',
  dragPreview: false,
  toolDocRows: {}
})

const { project, 
  onNodeDrag, 
  onMove,
  onMoveEnd,
  onViewportChange,
  setViewport, 
  addSelectedNodes, 
  findNode,
  getNodes,
  onNodeClick, 
  // setNodes,
  // setEdges,
  addNodes, 
  addEdges, 
  // updateNode,
  removeSelectedNodes
  } = useVueFlow({
    zoomOnScroll:false,
    zoomOnPinch: false, 
    zoomOnDoubleClick: false, 

    preventScrolling: false,
    connectOnClick: false
  })
onNodeDrag((event) => {
  console.log('节点拖拽事件：', event)
})
onMove(()=> {
  if (dialogVisible.value) {
    dialogVisible.value = false;
  };
  
})
onMoveEnd(()=> { 
 
  console.log('onMoveEnd',nodes.value)
})
onViewportChange(()=> {
  handlePaneClick({} as MouseEvent)

})
onNodeClick(($event:any) => {
  console.log('onNodeClick', $event, nodes.value)
  // const { node } = $event
  // if(node.id && node.selectable) {
    // node.class[1] = 'selected'
  // }
})

const updateSelectedNodesList = () => {
          // 给 Vue 一个机会更新响应式数据
          // setTimeout(() => {
          //   currentNodeToolDoc = getNodes.value.filter(node => node.selected);
          // }, 0);
        };
let alignRight = ref(false)
async function handleNodeClick($event:any) {
  if(dialogVisible.value) {
    dialogVisible.value = false
  }

  const node = $event?.node
  console.log('node', node)
  if(!node) return
  if(!node.selectable) return
  if (node && (node?.toolDocRows.docRows + node?.toolDocRows.toolRows) == 0) {
    dialogVisible.value = false
    return
  }
  if (!node.events) {
    node.events = {}
  }
  const targetNode = findNode(node.id);
  if (targetNode) {
    addSelectedNodes([node]);
    updateSelectedNodesList();
  }

  // addSelectedNodes([node.id])

  const screenPosition = project(node?.position)
  const nodeBounds = {
    x: screenPosition.x,
    y: screenPosition.y,
    width: 140,  // 根据样式定义的宽度
    height: 60,  // 估计高度
    top: screenPosition.y,
    right: screenPosition.x + 140,
    bottom: screenPosition.y + 60,
    left: screenPosition.x
  }
  console.log('节点边界信息', nodeBounds,window.innerWidth,screenPosition)
    node.selected = true
    nodes.value.forEach(item => { 
      if(item.id !== node.id) {
        item.class = ''
      } else {
        item.class = 'selected'
      }
    })
  

  // 更新 currentNodeToolDoc 的位置信息
  Object.assign(currentNodeToolDoc, {
    ...node,
    position: screenPosition
  })
  setTimeout(() => {
    const testNode = getNodes.value.filter(item => item.id == node.id);
    if(testNode.length) {
      testNode[0].selected = true
    }
    }, 0)

  // updateNode(node.id, {selected: true})
  
  //弹窗边界控制，如果弹窗超出屏幕的右边界，则将弹窗和被点击的节点右对齐
  if (562 > (window.innerWidth-node.position.x-dragDistance.value.x)) {
    console.log('弹窗超出屏幕的右边界')
    currentNodeToolDoc.position.x = nodeBounds.x - 484 + 60
    alignRight.value = true
  } else {
    console.log('弹窗未超出屏幕的右边界')
    currentNodeToolDoc.position.x = nodeBounds.x
    alignRight.value = false
  }
  console.log('currentNodeToolDoc',currentNodeToolDoc.position,dragDistance.value)
  localStorage.setItem('currentNodeToolDoc', JSON.stringify(currentNodeToolDoc))

    
  if((node.toolDocRows.docRows + node.toolDocRows.toolRows) > 0) {
    dialogVisible.value = true
  }
}

function handlePaneClick(e: MouseEvent) {

  if (dialogVisible.value) {
    dialogVisible.value = false;
  }
  removeSelectedNodes([])
  
}
function handleMove() {
  // 当画布移动时，如果弹窗显示则更新其位置
  if (dialogVisible.value && currentNodeToolDoc.id) {
    console.log('画布移动时,更新弹窗位置')
    const node = nodes.value.find(n => n.id === currentNodeToolDoc.id)
    if (node) {
      const screenPosition = project(node.position)
      Object.assign(currentNodeToolDoc, {
        ...currentNodeToolDoc,
        position: screenPosition
      })
    }
  }
  
}
let dragDistance = ref({ x: 0, y: 0 })
function handleMoveStart($event:any) {
  if (dialogVisible.value) {
    dialogVisible.value = false;
  }
  const {x, y} = $event.flowTransform
  dragDistance.value = { x: x, y: y }
  setTimeout(() => {
    const targetNodes = getNodes.value.filter(node => node.selected)
    targetNodes.forEach(node => { node.selected = false })
  }, 0)
}
function handleMoveEnd($event:any) {
  const {x, y} = $event.flowTransform
  // 计算拖动的距离
  dragDistance.value = { x: x - dragDistance.value.x, y: y - dragDistance.value.y }
  // 获取画布的尺寸
  console.log('拖动后的画布move的距离', dragDistance.value, currentNodeToolDoc,nodes.value)

  if(currentNodeToolDoc.id){
    removeSelectedNodes([])
  }
  // 拖动结束后自动聚焦到画布
  // handlePaneClick({} as MouseEvent);
}

// 处理新连接创建
function handleConnect(connection: Connection) {
  // 创建新连线
  const newEdge: Edge = {
    ...connection,
    id: `e${connection.source}->${connection.target}`,
    type: 'default'
  }
  edges.value.push(newEdge)
}

// 处理连线更新
function handleEdgeUpdate(event: EdgeUpdateEvent) {
  // 找到要更新的连线
  const edgeIndex = edges.value.findIndex(e => e.id === event.edge.id)
  if (edgeIndex !== -1) {
    // 更新连线的起点或终点
    edges.value[edgeIndex] = {
      ...edges.value[edgeIndex],
      source: event.connection.source,
      target: event.connection.target
    }
  }
}
function handleNodeMaxDistance(nodes: Node[]) {
  let maxY:any = null
  let minY:any = null
  nodes.forEach(item => {
    if (maxY === null || item.position.y > maxY) {
      maxY = item.position.y
    }
    if (minY === null || item.position.y < minY) {
      minY = item.position.y
    }
  })
  return { maxY, minY }
}
function handleNodePosition(nodes: Node[]) { 
  let maxDistance = handleNodeMaxDistance(nodes)
  let { maxY, minY} = maxDistance
  let middleY = (maxY + minY) / 2


  const xGroups: Record<number, Node[]> = {}
  nodes.forEach(node => {
    const x = node.position.x
    if (!xGroups[x]) {
      xGroups[x] = []
    }
    xGroups[x].push(node)
  })

  // 处理每个x组的节点
  Object.values(xGroups).forEach(groupNodes => {
    // 如果该x值只有一个节点，直接将其y设置为中轴线
    if (groupNodes.length === 1) {
      groupNodes[0].position.y = middleY
    } 
    // 如果该x值有多个节点，让它们相对于中轴线对称分布
    else {
      // 找到当前组的最小和最大y值
      const groupMinY = Math.min(...groupNodes.map(node => node.position.y))
      const groupMaxY = Math.max(...groupNodes.map(node => node.position.y))
      
      // 计算当前组的中心点
      const groupCenterY = (groupMinY + groupMaxY) / 2
      
      // 计算偏移量，使组中心对齐到整体中轴线
      const offset = middleY - groupCenterY
      
      // 更新每个节点的位置
      groupNodes.forEach(node => {
        node.position.y += offset
      })
    }
  })

  return nodes
}
let stepFlow = ref([{
  process_id: '',
  process_name: '',
}])
//格式化节点数据
async function formatNodeData(result: any[]) {
  let maxBottomY = 0
  nodes.value = []
  edges.value = []
  stepFlow.value = flowDataTotal.value.map((item:any) => ({
    process_id: item.process_id,
    process_name: item.process_name
  }))
  console.log('stepFlow',stepFlow.value, result )

  result.length && result.forEach((item: any, index: number) => { 
    //每一个流程
    const flowBaseY = index === 0 ? 60 : maxBottomY + 150 - 70
    
    
    item.step_data.length && item.step_data.forEach((stepItem:any, stepIndex: number) => {
      //每一个流程节点

      let disInstanceX = 160 + 40
      
      const nodeY = flowBaseY + (stepItem.y + 1) * 90
      let obj = {
        id: stepItem.id,
        type: 'custom',
        hidden: false,
        position: {x: disInstanceX * (stepItem.x + 1 ), y: nodeY},
        data: {label: stepItem.name, iconUrl: stepItem.icon_url},
        toolDocRows: { docRows: stepItem.toolDocRows.docRows, toolRows: stepItem.toolDocRows.toolRows},
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
        selectable: (stepItem.toolDocRows.docRows + stepItem.toolDocRows.toolRows) == 0 ? false : true,
        connectable: false,
        selected: false,
        class: [(stepItem.toolDocRows.docRows + stepItem.toolDocRows.toolRows) == 0 ? 'disabled-node' : '',
        ],
        style: { elevation: 'node' }
      }
      if(stepItem.x == 0){ 
        // obj.type = 'input'
      }
      if(stepIndex == item.step_data.length - 1) {
        // obj.type = 'output'
      }

      nodes.value.push((obj as any))

      maxBottomY = Math.max(maxBottomY, nodeY)
    })
    //处理每个流程的连线
    autoGenerateEdge(item)
  })
  let handleNodes = handleNodePosition(nodes.value)
  
  await nextTick()
  
  addNodes(handleNodes)
  await nextTick()
  addEdges(edges.value)
}


function autoGenerateEdge(flowItem: any) { 
  const steps = flowItem?.step_data || [];
  
  // 按 x 坐标分组
  const xGroups = steps.reduce((acc:any[], step:any) => {
    if (!acc[step.x]) acc[step.x] = [];
    acc[step.x].push(step);
    return acc;
  }, {} as Record<number, typeof steps>);

  // 为每个节点生成与前一列的连接
  steps.forEach((currentNode:any) => {
    if (currentNode.x <= 0) return; // 跳过首列

    const prevX = currentNode.x - 1;
    const prevNodes = xGroups[prevX] || []; // 获取前一列所有节点

    prevNodes.forEach((sourceNode:any) => {
      const edgeId = `e${sourceNode.id}->${currentNode.id}`;
      
      // 防止重复添加边
      const existingEdge = edges.value.find((e) => e.id === edgeId);
      if (!existingEdge) {
        edges.value.push({
          id: edgeId,
          source: `${sourceNode.id}`,
          target: `${currentNode.id}`,
          type: 'default',
          animated: false,
          updatable: true,
          markerEnd: {
            type: MarkerType.Arrow,
            width: 20,
            height: 20,
            color: '#2D78D8'
          },
          style: { stroke: '#2D78D8', strokeWidth: 1 }
        });
      }
    });
  });
}
let isFetching = ref(false)


const debounceLastNodeClick = debounce(() => { 
  handleLastNodeClick()
}, 1000)
async function handleLastNodeClick() { 
  let currentNode = JSON.parse(localStorage.getItem('currentNodeToolDoc') || '{}')
  if(!currentTab?.id) return
  
  let targetNode = null;
  
  if (currentNode.id && nodes.value.length > 0) {
    targetNode = nodes.value.find(node => node.id == currentNode.id);
  }
  console.log('find targetNode:', targetNode)

  if (targetNode) {
    const completeNodeData = {
      ...targetNode,
      selected: true,
      class: 'selected',
      events: targetNode.events || {}
    };
    handleNodeClick({
      node: completeNodeData,
      event: null
    });
    console.log('加载后点击缓存节点:', targetNode.id);
  } else if (nodes.value.length > 0) {
    let firstNode = nodes.value.find((item: any) => item?.toolDocRows.toolRows > 0 || item?.toolDocRows.docRows > 0)
    if(firstNode) {
      const completeNodeData = {
        ...firstNode,
        selected: true, // 确保设置选中状态
        events: firstNode.events || {},
        class: 'selected',
      };
      handleNodeClick({
        node: completeNodeData,
        event: null
      })
    }
    console.log('加载后点击第一个节点',firstNode);
  }
  
}
let currentTabStr = localStorage.getItem('currentTab')
let currentTab = currentTabStr ? JSON.parse(currentTabStr) : null
onBeforeMount(() => {  
  
})
function findFlowNodes(nodes:any[]) {
  let targetFlowId:string | null = null
  console.log('findFlowNodes',currentFlow.value)
  if(currentFlow.value && currentFlow.value.process_id) {
    nodes.length && nodes.forEach(itemFlow => {
        if(itemFlow.process_id == currentFlow.value.process_id) {
            targetFlowId = itemFlow.process_id
          }
    })
  }
  let flow = nodes.find(flow => flow.process_id == targetFlowId)
    console.log('flow',flow)
  return flow || nodes[0]
}
interface FlowItem {
  process_id: string;
  process_name: string;
  step_data: any[];
}
let flowDataTotal = ref<FlowItem[]>([])
let isShowFlow = ref(false)
const throttledProcessData = throttle(async (res: any) => {
  if (res.code == 0) { 
    isShowFlow.value = false;
    flowDataTotal.value = res.result;
    let currentFlow = findFlowNodes(res.result)

    if(res.result.length > 0) { 
      setTimeout(() => {
        formatNodeData(res.result);
        // formatNodeData([{...currentFlow}]);
        isShowFlow.value = true;
    console.log('<<<<<<<<<<<<<<<<<<<<查询到的流程数据===>', nodes.value);
    // await nextTick();
    setViewport({ x: 0, y: 0, zoom: 1 });
    handlePaneClick({} as MouseEvent);
    dragDistance.value = { x: 0, y: 0 };
    res.result.length > 0 && debounceLastNodeClick();
    sessionStorage.setItem('isFlowLoaded', JSON.stringify(true));
      }, 0);
    } else {
      dialogVisible.value = false;
    }
  }
  isFetching.value = false;
}, 1000, { leading: true, trailing: false }); 
onMounted(() => {

  (window as any).electronAPI?.on('get-plugProcessStep', async (res: any) => { 
    throttledProcessData(res)
  });

  
  if((window as any).electronAPI.on) {
      (window as any).electronAPI?.on('query-flow-step', (id: any) => { 
        
      console.log('查询流程步骤', id)
      

      if (isFetching.value) {
        console.log('请求正在进行中，跳过本次请求')
        return
      }
      if(dialogVisible.value) {
        dialogVisible.value = false
      }
      isFetching.value = true
      if(id) { 
        let isPlugLocalConfig = sessionStorage.getItem('isPlugLocalConfig')
        let handleVersion = isPlugLocalConfig ? JSON.parse(isPlugLocalConfig) : null;
        (window as any).electronAPI?.send('fetch-data',{
          url: `/openapi/v1/core/plug/get-plugProcessStep?debug_version=${handleVersion ? 0 : 1}`,
          data: {
            categoryId: id,
          }
        })
      }
    })
  }
  
  (window as any).electronAPI?.on('update-location', () => { 
    console.log('update-location' )
    handlePaneClick({} as MouseEvent);
  });
  (window as any).electronAPI?.on('clear-flow-step', () => { 
    console.log('clear流程步骤')
    nodes.value = []
    edges.value = []
        handlePaneClick({} as MouseEvent);
  });
  
})

const nodeToolDocRef = ref<HTMLElement | null>(null)
const onSelectionChange = ({ nodes : [] }) => {
}
const onPaneResize = () => {
  console.log('画布大小变化')
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

function closeDrawer() {
  docPreview.value = false
  console.log('关闭drawer',docPreview.value)
}
let isElectron = (window as any)?.ElectronAPI?.isElectron
let selectedTool = ref<any>(null)
let showDetail = ref(false)
function handleToolPreview(value: any) {
  selectedTool.value = value
  showDetail.value = true
}


const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
function handlePaneContextMenu(event: MouseEvent) {
  event.preventDefault()
  
  // 设置右键菜单位置
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  
  // 显示右键菜单
  contextMenuVisible.value = true
  
  console.log('画布右键菜单')
}
function handleNodeContextMenu(event: MouseEvent, node: any) {
  event.preventDefault()
  
  // 设置右键菜单位置
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  
  // 显示右键菜单
  contextMenuVisible.value = true
  
  console.log('节点右键菜单', node)
}
function hideContextMenu() {
  contextMenuVisible.value = false
}
function openDevTools() {
  // 通过 electronAPI 打开开发者工具
  if ((window as any).electronAPI?.send) {
    (window as any).electronAPI?.send('open-dev-tools')
  }
  hideContextMenu()
}
onMounted(() => {
  // 添加全局点击监听器来隐藏右键菜单
  const handleClickOutside = (event: MouseEvent) => {
    if (contextMenuVisible.value) {
      const contextMenu = document.querySelector('.context-menu')
      if (contextMenu && !contextMenu.contains(event as any)) {
        hideContextMenu()
      }
    }
  }
  
  document.addEventListener('click', handleClickOutside)  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
  if((window as any).electronAPI.on) {
    (window as any).electronAPI.on('request-failed',(res:any) => {
      console.error('request-failed',res)
      isShowErrorDialog.value = true
      errorInfo.value = res
    });
  }
})
let isShowErrorDialog = ref(false)
let errorInfo = ref({
  name:'',
  url:''
})
let errorDialogTop = computed(() => { 
  return (window.innerHeight - 245) / 2
})

const activeStepIndex = ref(0)
const activeStepOffsetX = ref(0)
const activeStepItemWidth = ref(0)
let currentFlow = computed(()=>{
  return flowDataTotal.value[activeStepIndex.value]
})
function handleStepFlowClick(item:any,index:any) {
  console.log('step-flow-click', item, index)
  isShowFlow.value = false
  if(dialogVisible.value) {
    dialogVisible.value = false
  }
  activeStepIndex.value = index
  updateActiveStepPosition(index)
  let targetFlow = findFlowNodes(flowDataTotal.value)
  formatNodeData([{...targetFlow}]);
  setTimeout(() => { 
    isShowFlow.value = true
  debounceLastNodeClick()
  }, 0)

}
async function updateActiveStepPosition(index: number) {
  await nextTick()
  const stepItems = document.querySelectorAll('.step-flow-item')
  if (stepItems[index]) {
    const item = stepItems[index] as HTMLElement
    activeStepOffsetX.value = item.offsetLeft
    activeStepItemWidth.value = item.offsetWidth
  }
}
watch(stepFlow, () => {
  updateActiveStepPosition(activeStepIndex.value)
})

onMounted(() => {
  // 初始化背景位置
  setTimeout(() => {
    updateActiveStepPosition(0)
  }, 0)
})


</script>

<template>
  <Transition name="vue-flow-transition" mode="out-in">
  <VueFlow 
  v-if="isShowFlow"
    :nodes="nodes"
    :edges="edges"
    @pane-resize="onPaneResize"
    @node-click="handleNodeClick($event)"
    @pane-click="handlePaneClick"
    @move="handleMove"
    @zoom="handleMove"
    @move-start="handleMoveStart"
    @move-end="handleMoveEnd"
    @connect="handleConnect"
    @edge-update="handleEdgeUpdate"
    @paneContextMenu="handlePaneContextMenu"
    :edges-updatable="true"
    :nodes-connectable="true"
    @selection-change="onSelectionChange"
    >
    <template #node-custom="customNodeProps">
      <CustomNode v-bind="customNodeProps" @contextmenu="handleNodeContextMenu($event, customNodeProps)"/>
    </template>
    <template #node-special="specialNodeProps">
      <SpecialNode v-bind="specialNodeProps" />
    </template>
    <template #edge-special="specialEdgeProps">
      <SpecialEdge v-bind="specialEdgeProps" />
    </template>
    
  </VueFlow></Transition>
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
        <div class="context-menu-item" @click="openDevTools">
          <span class="option-name">打开开发者工具</span>
        </div>
      </div>
    </div>
  </teleport>
  <div class="node-tool-doc"
      ref="nodeToolDocRef"
      :style="{ left: currentNodeToolDoc.position.x+dragDistance.x*2 + 'px', top: currentNodeToolDoc.position.y+dragDistance.y*2 + 90 + 'px' }"
      v-if="dialogVisible && (currentNodeToolDoc?.toolDocRows?.docRows > 0 || currentNodeToolDoc?.toolDocRows?.toolRows > 0)"
      >
      <div class="tool-box">
            <toolAndDoc 
          :nodeDetail="currentNodeToolDoc" 
          :alignRight="alignRight"
          @doc-preview="handleDocPreview"
          @tool-detail="handleToolPreview"
          />
      </div>
    
  </div>
  <t-dialog 
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
                <t-image v-if="selectedTool?.icon_url"
                    :src="`https://${selectedTool?.icon_url}`"
                    :style="{ width: '120px', height: '120px' }"
                />
                <t-image v-else
                    :src="toolimg"
                    :style="{ width: '120px', height: '120px' }"
                />
            </div>
        </div>
        <div class="tool-info">
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
                <div class="info-des">{{ selectedTool?selectedTool.flag_content:'无' }}</div>
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
            <div class="line"></div>
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
    <t-dialog 
        v-model:visible="isShowErrorDialog" 
        header="提示" 
        width="500px"
        :top="errorDialogTop"
        class="custome-dialog"
        :confirmBtn="{ 
          content: '确定', 
          }"
        alignment="center"
        :cancelBtn="null"
        @confirm="() => { isShowErrorDialog = false }"
        >
        <div class="error-dialog">
          <div class="error-content">
            <img :src="error" alt="error" class="error-icon" />
            {{errorInfo?.url}}
            请求失败，请检查登录信息是否正确后再行尝试！</div>
        </div>
      </t-dialog>
  <t-drawer v-model:visible="docPreview" placement="right" size="80%" :footer="false"
            @close="closeDrawer"
  >
      <template #header>{{ docPreviewDetail.url }}</template>
      <webview 
        v-if="isElectron"
        :src="docPreviewDetail.url"
        partition="persist:qqDocs"
        style="width:100%; height:calc(100% - 60px);"
        autosize="on"
      ></webview>
      <iframe v-else
        :src="docPreviewDetail.url"
        frameborder="0"
        style="width:100%;height:100%;border:none;"
      ></iframe>
  </t-drawer>
  <div class="setp-box-bg" v-if="false">
    <div class="setp-box">
      <div class="step-flow">
          <div class="step-flow-item" 
          v-for="(item,index) in stepFlow" 
          :key="index"
          @click="handleStepFlowClick(item,index)"
          :class="{ 'active': activeStepIndex === index }"
          >
            <div class="step-flow-item-icon">
            </div>
            <div class="step-flow-item-title">{{item.process_name}}</div>
          </div>
      </div>
      <div class="step-flow-bg" :style="{ 
              width: `${activeStepItemWidth}px`, 
              transform: `translateX(${activeStepOffsetX}px)`,
              transition: 'all 0.3s ease'
            }"></div>
    </div>
  </div>
  
  
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>
<style lang="less" scoped>
  :deep(.vue-flow__node) {
    max-width: 180px;
    height: 60px;
    border-radius: 80px;
    background:  transparent;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    line-height: 20px;
    &:hover {
      // background: rgba(13, 32, 81, 0.30);
      .custom-node-wrapper {
        background: linear-gradient(107deg, #62acec, #3489f6 42.73%, #7e27ff 99.87%);
        .custom-node {
          background: #0D2051;
          .step {
            .icon {
              background: rgb(13, 32, 81, .5);
            }
          }
        }
      }
    }
    &.selected {
      .custom-node-wrapper {
        .custom-node {
          background: linear-gradient(107deg, #62ACEC 0%, #3489F6 42.73%, #7E27FF 99.87%);
          .step {
            .icon {
              background: rgb(13, 32, 81, .5);
            }
          }
        }
      }
    }
  }
  .selected {
      .custom-node-wrapper {
        .custom-node {
          background: linear-gradient(107deg, #62ACEC 0%, #3489F6 42.73%, #7E27FF 99.87%);
          .step {
            .icon {
              background: rgb(13, 32, 81, .5);
            }
          }
        }
      }
  }
  
  // .active {
  //     background: linear-gradient(107deg, #62ACEC 0%, #3489F6 42.73%, #7E27FF 99.87%);
  // }
  :deep(.vue-flow__node-input.selected, .vue-flow__node-input:focus, .vue-flow__node-input:focus-visible) {
    background: linear-gradient(107deg, #62ACEC 0%, #3489F6 42.73%, #7E27FF 99.87%);
  }
  
  :deep(.vue-flow__node.draggable) {
    cursor: pointer;
  }
  
  .node-tool-doc {
    position: absolute;
    border-top: 1px solid rgba(255, 255, 255, .2);
    border-bottom: 1px solid rgba(255, 255, 255, .2);
    border-radius: 10px;
    padding: 34px 0 4px 24px;
    background-color: #313131;
    z-index: 100;
  }
  .vue-flow__node-custom {
    background: #9CA8B3;
    color: #fff;
    padding: 10px;
  }
  :deep(.vue-flow__node.disabled-node) {
    opacity: 0.3 !important;
    cursor: not-allowed !important;
    filter: grayscale(80%) !important;
  }


  .gradient-border-node {
    padding: 2px; 
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

.gradient-border-node .node-content {
  background: white;
  padding: 12px 16px;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
  min-width: 120px;
}

.gradient-border-node.selected {
  box-shadow: 0 0 0 2px #3b82f6;
}
:deep(.vue-flow__handle) {
  opacity: 0;
}
:deep(.t-dialog) {
  color: #ababab;
  background-color: #222;
  border: transparent;
}
:deep(.t-dialog__body) {
  color: #ababab;
}
:deep(.t-dialog__header) {
    color: #efefef;
    font-size: 24px;
}
:deep(.t-dialog__header-content) {
    color: #ababab;
}
:deep(.t-dialog__close) {
    color: #ababab;
}
:deep(.t-popup__content) {
  background-color: #37383b;
}
:deep(.t-select .t-popup__content) {
  background-color: #37383b !important; // 使用 !important 提高优先级
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
.context-menu {
  background: linear-gradient(180deg, #282828 0%, #222222 100%);
  border: 1px solid rgba(19, 19, 19, 0.8);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 120px;
  
  .context-menu-item {
    display: flex;
    align-items: center;
    padding: 8px;
    font-size: 12px;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    
    &:hover {
      background: #3484ea;
      color: white;
    }
    
    .option-name {
      margin-left: 8px;
    }
  }
}
.error-content {
  display: flex;
  line-height: 28px;
  .error-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    margin-top: 2px;
    filter: drop-shadow(24px 0 0 #ff4d4f);
    transform: translateX(-26px);
  }
}
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
}
.setp-box-bg {
    position: absolute;
    left: 50%;
    top: 48px;
    transform: translateX(-50%);
    height: 40px;
    background: linear-gradient(107deg,#62acec,#3489f6 42.73%,#7e27ff 99.87%);
      padding: 2px;
      border-radius: 54px;
}
.setp-box {
    height: 40px;
    background: #000;
    border-radius: 50px;
}
.step-flow {
  display: flex;
  position: relative;
  z-index: 100;
  height: 100%;
  .step-flow-item {
    font-size: 14px;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;
    z-index: 101;
    padding: 8px 16px;
    border-radius: 50px;
    &.active {
      color: white;
      font-weight: bold;
    }
  }
}
.step-flow-bg {
  position: absolute;
  height: 40px;
  background: linear-gradient(107deg, #62acec, #3489f6 42.73%, #7e27ff 99.87%);
  z-index: 90;
  border-radius: 50px;
  top: 2px;
  left: 0;
  padding: 0 2px;
}
:deep(.vue-flow) {
  transition: opacity 0.2s ease;
}

.vue-flow-enter-active, .vue-flow-leave-active {
  transition: opacity 0.2s ease;
}

.vue-flow-enter-from, .vue-flow-leave-to {
  opacity: 0;
}
.vue-flow-transition-enter-active,
.vue-flow-transition-leave-active {
  transition: all 0.5s ease;
}
.vue-flow-transition-enter-from {
  opacity: 0;
  transform: translateX(600px);
}
.vue-flow-transition-leave-to {
  opacity: 0;
  transform: translateX(-600px);
}
.vue-flow-transition-enter-to,
.vue-flow-transition-leave-from {
  opacity: 1;
  transform: translateX(0)
}
</style>