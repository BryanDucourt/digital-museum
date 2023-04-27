<template>
  <div id="webgl" style="height: 100%; width: 100%" ref="canvasRef"></div>
  <div style="position: absolute; z-index: 1">
    <button @click="handleNext">prev</button>
  </div>
</template>

<script setup lang="ts">
import { Page } from '../scripts/page'
import { onMounted, ref } from 'vue'
// import { useClick } from '../scripts/mouse'
//
// let click = useClick()

let page = new Page('abc')

const canvasRef = ref()

function animate() {
  page.render()
  requestAnimationFrame(animate)
}

function handleNext() {
  page.nextPage()
}

onMounted(() => {
  canvasRef.value.appendChild(page.renderer.domElement)

  animate()
})
</script>

<style scoped></style>
