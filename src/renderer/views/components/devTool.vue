<!-- <script lang="ts" setup>
import { onMounted,onUnmounted,ref,reactive  } from 'vue'

let props = defineProps({
    position: { type: Object, default: {} },
    menu: { type: Array, default: [
        { id: '', name: '' }
    ] }
})
let emits = defineEmits(['hideContextMenu', 'handleToolEvent', 'handleMenuItemCommand'])
// const contextMenuVisible = ref(false)
// const contextMenuPosition = reactive({ x: 0, y: 0 })
// function handlePaneContextMenu(event: MouseEvent) {
//   event.preventDefault()
  
//   // 设置右键菜单位置
//   contextMenuPosition.x = event.clientX
//   contextMenuPosition.y = event.clientY
  
//   // 显示右键菜单
//   contextMenuVisible.value = true
  
//   console.log('画布右键菜单')
// }
// function handleNodeContextMenu(event: MouseEvent, node: any) {
//   event.preventDefault()
  
//   // 设置右键菜单位置
//   contextMenuPosition.x = event.clientX
//   contextMenuPosition.y = event.clientY
  
//   // 显示右键菜单
//   contextMenuVisible.value = true
  
//   console.log('节点右键菜单', node)
// }
function hideContextMenu() {
  contextMenuVisible.value = false
}
function openDevTools() {
  // 通过 electronAPI 打开开发者工具
  if ((window as any).electronAPI?.send) {
    (window as any).electronAPI?.send('open-dev-tools')
  } else {
    // 备用方案：如果在浏览器环境中
    console.log('Opening dev tools not supported in this environment')
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
})
</script>
<template>
    <teleport to="body">
    <div 
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
</template>
<style></style> -->