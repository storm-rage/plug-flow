import { createRouter, createWebHashHistory } from 'vue-router'
import Roles from '../renderer/views/roles/index.vue'
// import HardSurface from '../renderer/views/hardSurface/index.vue'
import queryResult from '../renderer/views/components/queryResult.vue'
// import scene from '../renderer/views/components/scene.vue'
// import design from '../renderer/views/components/design.vue'
// import effect from '../renderer/views/components/effect.vue'

const routes = [
  { path: '/', name: 'roles', component: Roles },
  { path: '/queryResult', name: 'queryResult', component: queryResult },
  // { path: '/scene', name: 'scene', component: scene },
  // { path: '/design', name: 'design', component: design },
  // { path: '/effect', name: 'effect', component: effect },
]

const router = createRouter({
  history: createWebHashHistory(),
  // history: createWebHistory(),
  routes
})

export default router
