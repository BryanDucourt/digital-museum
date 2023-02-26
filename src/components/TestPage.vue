<template>
  <div id="webgl" style="height: 100%; width: 100%" ref="canvasRef"></div>
</template>

<script setup lang="ts">
import { Page } from '../scripts/page'
import { onMounted, ref } from 'vue'
import { useClick } from '../scripts/mouse'

let click = useClick()

// usePage('webgl')
let page = new Page(click)
// let container: HTMLElement | null
const canvasRef = ref()
// function render() {
//   requestAnimationFrame(render)
//   page.renderer.render(page.scene, page.camara)
// }

onMounted(() => {
  canvasRef.value.appendChild(page.renderer.domElement)
  canvasRef.value.addEventListener('mousemove', function (evt: MouseEvent) {
    page.onMouseMove(evt, canvasRef)
  })
  page.render()
})
</script>

<style scoped></style>
