<script lang="ts" setup>
import { computed  } from 'vue'

let props = defineProps({
    position: { type: Object, default: {} },
    menu: { type: Array, default: [
        { id: '', name: '' }
    ] }
})
let emits = defineEmits(['hideContextMenu', 'handleToolEvent', 'handleMenuItemCommand'])
function handleToolEvent(str:any, obj:any) {
    emits('handleToolEvent', { str, obj })
}
let menuList = computed(() => {
    return props.menu
})
let contextMenuPosition = computed(() => { 
    return props.position
})
function handleMenuItemCommand(item:any, index:any) {
    emits('handleMenuItemCommand', { item, index })
}
</script>
<template>
    <div 
        class="context-menu-overlay"
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
                    <div class="context-menu-item" @click="handleToolEvent('',{})">
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
                            :key="(item as any).id"
                            class="menu-extra-item"
                            @click="handleMenuItemCommand(item,index)"
                            >
                            <span class="option-name">{{(item as any).name}}</span>
                        </div>
                    </div>
            </div>
        </div>
</template>
<style></style>