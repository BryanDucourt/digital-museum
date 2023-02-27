<template>
  <div id="webgl" style="height: 100%; width: 100%" ref="canvasRef"></div>
  <div
    style="z-index: 2; position: absolute; height: 10%; width: 10%; left: 0; top: 0"
    ref="above"
  ></div>
</template>

<script setup lang="ts">
import { Page } from '../scripts/page'
import { onMounted, ref } from 'vue'
import { useClick } from '../scripts/mouse'

let click = useClick()

let page = new Page(click)

const canvasRef = ref()
const above = ref()

onMounted(() => {
  canvasRef.value.appendChild(page.renderer.domElement)
  above.value.appendChild(page.renderer_above.domElement)
  canvasRef.value.addEventListener('mousemove', function (evt: MouseEvent) {
    page.onMouseMove(evt, canvasRef)
  })
  page.render()
})
</script>

<style scoped></style>
