import { createApp } from 'vue'
import './style.css'
import './assets/styles/variab.css'
import App from './App.vue'
import router from './router'
import TDesign from 'tdesign-vue-next';


createApp(App).use(TDesign).use(router).mount('#app')
