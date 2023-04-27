import ImageAnalyze from './components/ImageAnalyze.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import TestPage from './components/TestPage.vue'

const routes = [
  { path: '/page', component: TestPage },
  { path: '/image', component: ImageAnalyze }
]

const router = createRouter({ history: createWebHashHistory(), routes: routes })

export { router }
