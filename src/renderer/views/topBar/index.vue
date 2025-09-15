<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from 'tdesign-icons-vue-next'
import ToolLogo from '../../../assets/tool-logo1.png';


const title = ref('智链工坊');
const isMaximized = ref(false);

function handleMini() {
    (window as any).electronAPI.send('win-minimize')
}
function handleMax() {
    (window as any).electronAPI.send('win-maximize')
        isMaximized.value = !isMaximized.value;

}
function handleClose() {
    (window as any).electronAPI.send('win-close')
}
function handleRefresh() {
    window.location.reload()
}

onMounted(()=>{
    (window as any).electronAPI.on('win-maximize', () => {
        isMaximized.value = true;
    });
    
})

</script>
<template>
    <div class="top-bar">
        <div class="left">
            <div class="logo">
                <img :src="ToolLogo" alt="tool-logo"></img>
            </div>
            <div class="title">
                {{title}}
            </div>
        </div>
        <div class="right">
            <div class="mini" @click="handleRefresh">
                <Icon name="refresh" size="16px"/>
            </div>
            <div class="mini" @click="handleMini">
                <Icon name="minus" size="24px"/>
            </div>
            <div class="max" @click="handleMax">
                <Icon :name="isMaximized ? 'fullscreen-exit-1' : 'fullscreen-1'" size="20px"/>
            </div>
            <div class="close" @click="handleClose">
                 <Icon name="close" size="24px"/>
            </div>
        </div>
    </div>
</template>
<style scoped lang="less">
.top-bar {
    -webkit-app-region: drag;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    background-color: #191a1c;
    color: #dfdfdf;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 40px;
    z-index: 999;
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
    .right {
        -webkit-app-region: no-drag;
        display: flex;
        .mini, .max, .close {
            cursor: pointer;
            margin-left: 10px;
            user-select: none;
            width: 24px;
            height: 24px;
            text-align: center;
            line-height: 24px;
            border-radius: 50%;
            &:hover {
                background: #666;
            }
        }
        .close {
            &:hover {
                background: rgba(213, 0, 0, 0.874);
            }
        }
        .upload{
            cursor: pointer;
        }
    }
    
}
</style>