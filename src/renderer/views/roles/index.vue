<script setup lang="ts">
import { ref, onMounted } from 'vue'
import vueFlow from '../vueFlow/index.vue'

const targetUrl = ref('')
const deferredPrompt = ref<any>(null)
const showInstallButton = ref(false)
function addUrl() {
   if (!targetUrl.value) {
    console.log('请输入URL')
    return
  }
  
  // 验证URL格式
  try {
    let url = targetUrl.value
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
      targetUrl.value = url
    }
    new URL(url)
  } catch (e) {
    console.log('URL格式无效')
    return
  }
    
  generateManifest(targetUrl.value)

  // 触发PWA安装过程
  triggerInstall()
  createUrlShortcut2(targetUrl.value)
}

// 为输入的URL生成动态manifest
function generateManifest(url: string) {
  const manifest = {
    name: `PWA for ${url}`,
    short_name: 'Tool Strip',
    start_url: url,
    display: 'standalone',
    background_color: '#ffffff',
    description: 'PWA for specific URL',
    icons: [
      {
        src: 'icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
  
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
  const manifestURL = URL.createObjectURL(blob)
  
  // 更新manifest链接
  let manifestLink = document.querySelector('link[rel="manifest"]')
  if (manifestLink) {
    manifestLink.setAttribute('href', manifestURL)
  } else {
    manifestLink = document.createElement('link')
    manifestLink.setAttribute('rel', 'manifest')
    manifestLink.setAttribute('href', manifestURL)
    document.head.appendChild(manifestLink)
  }
}
// 触发安装流程的新函数
async function triggerInstall() {
  try {
    //如果目标url是一个pwa，尝试使用新的Web API触发安装
    // 注意：这个API可能在某些浏览器中不可用
    // if ('BeforeInstallPromptEvent' in window) {
    //   // 创建一个自定义的安装提示事件
    //   const installEvent = new Event('beforeinstallprompt')
    //   window.dispatchEvent(installEvent)
    // }
    
    // 如果有延迟的安装提示，使用它
    if (deferredPrompt.value) {
      deferredPrompt.value.prompt()
      const choiceResult = await deferredPrompt.value.userChoice
      if (choiceResult.outcome === 'accepted') {
        console.log('用户接受了安装提示')
      } else {
        console.log('用户取消了安装提示')
      }
      deferredPrompt.value = null
    } else {
      // 提示用户手动安装
      console.log('请通过浏览器菜单手动安装此应用')
      // 可以在这里添加更友好的用户提示，比如显示一个模态框说明如何手动安装
    }
  } catch (error) {
    console.error('安装过程中出错:', error)
    console.log('无法自动触发安装，请手动安装')
  }
}
//创建快捷方式url
function createUrlShortcut(url: string) {
  const hostname = new URL(url).hostname
  const urlContent = `[InternetShortcut]
    URL=${url}
    IconIndex=0`
  // 创建并下载文件
  const blob = new Blob([urlContent], { type: 'application/internet-shortcut' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${hostname}.url`
  // 添加提示信息
  alert('快捷方式文件将下载到您的默认下载目录，请将其移动到桌面使用')
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // 下载完成后显示提示
  setTimeout(() => {
    console.log('快捷方式已下载，请在下载目录中找到文件')
  }, 1000)
}
// 创建快捷方式url - Electron版本
async function createUrlShortcut2(url: string) {
  let isPwa = await isPwaSupported(url)
  try {
    // 检查是否在Electron环境中
    if ((window as any).electronAPI) {
      console.log('当前环境是Electron')
      
      if (isPwa) {
        console.log(url,'是pwa，开始安装pwa到桌面')
        //目标url是pwa，则安装pwa到桌面
        // await installPwa(url)
        //todo: 创建成功后，将结果返回给用户
        
      } else {
        console.log('目标url不是PWA，将使用浏览器API创建快捷方式')
        //目标url不是pwa，则创建快捷方式
        const hostname = new URL(url).hostname
        const title = hostname.length > 20 ? hostname.substring(0, 20) + '...' : hostname
        
        const result = await (window as any).electronAPI.invoke('create-desktop-shortcut', {
          url: url,
          title: title,
        })
        if(result.success){
          alert(`快捷方式${title}已成功创建到桌面`)
          console.log('目标url不是PWA')
        } else {
          alert(`创建快捷方式失败: ${result?.error || '未知错误'}`)
        }
      }
      
    } else {
      console.log('当前环境非Electron，将使用浏览器API创建快捷方式')
      createUrlShortcut(url)
    }
  } catch (error) {
    console.error('创建快捷方式失败:', error)
    alert('创建快捷方式失败，请确保应用有相应权限')
  }
}
//检测是否支持pwa
async function isPwaSupported(url:string) {
  try {
    //dev环境，注意跨域
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
    });
    const html = await response.text();

    // 检查是否有 manifest.json
    const hasManifest = html.includes('rel="manifest"');

    // 检查是否 HTTPS（或 localhost）
    const isSecure = url.startsWith('https://') || url.startsWith('http://localhost');

    // 检查是否有 Service Worker（需在页面上下文中运行）
    let hasServiceWorker = false;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      hasServiceWorker = registrations.length > 0;
    }

    return hasManifest && isSecure && hasServiceWorker;
  } catch (error) {
    console.error('PWA 检测失败:', error);
    return false;
  }
}
// async function installPwa() {
//   try {
//     const registration = await navigator.serviceWorker.register('/service-worker.js');
//     await registration.update();
//     await registration.sync.register('sync-data');
//     await registration.pushManager.subscribe({
//       userVisibleOnly: true,
//       applicationServerKey: 'your-public-key',
//     });
//     console.log('PWA 已安装');
//   } catch (error) {
// }
// }


onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    // 确保是目标URL时才触发
    // if (window.location.href.includes(targetUrl.value)) {
      e.preventDefault()
      deferredPrompt.value = e
      // showInstallButton.value = true
      console.log(deferredPrompt.value)
    // }
  })

  window.addEventListener('appinstalled', () => {
    showInstallButton.value = false
    // emit('installed')
  })
  
})
</script>
<template>
    <div class="content-box">
        <div class="work-flow" v-if="false">        
            <t-input placeholder="请输入目标url" v-model="targetUrl" />
            <t-button theme="default" variant="base" @click="addUrl">添加快捷方式</t-button>
        </div>
        <div class="work-flow">
          <vue-flow/>
        </div>
    </div>
</template>
<style lang="less" scoped>
.content-box {
    width: 100%;
    height: 100%;
    color: #fff;
    .work-flow {
      position: relative;
      height: calc(100% - 10px);
      line-height: 100%;
      overflow: hidden;
    }
}
</style>