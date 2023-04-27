<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
onMounted(() => {
  const router = useRouter()
  router.push('/page')
})
</script>

<template>
  <el-container style="height: 100%; width: 100%">
    <router-view style="height: 100%; width: 100%"></router-view>
  </el-container>
</template>
