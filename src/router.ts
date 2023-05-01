import ImageAnalyze from './components/ImageAnalyze.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import TestPage from './components/TestPage.vue'
import MainPage from './components/MainPage.vue'

const routes = [
  { path: '/page', component: TestPage },
  { path: '/image', component: ImageAnalyze },
  { path: '/main', component: MainPage }
]

const router = createRouter({ history: createWebHashHistory(), routes: routes })

export { router }
