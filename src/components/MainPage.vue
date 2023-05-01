<template>
  <el-container>
    <el-row justify="space-evenly" class="container">
      <el-col :span="7">
        <el-card shadow="hover" class="display" :body-style="{ padding: '0px' }">
          <el-image src="/human.jpeg"></el-image>
        </el-card>
      </el-col>
      <el-col :span="7">
        <el-card shadow="hover" class="display" :body-style="{ padding: '0px' }">
          <el-image src="/book.jpeg"></el-image>
        </el-card>
      </el-col>
      <el-col :span="7">
        <el-card shadow="hover" class="display" :body-style="{ padding: '0px' }">
          <el-image src="/simu.jpeg"></el-image>
          <h1>模拟攻防</h1>
        </el-card>
      </el-col>
    </el-row>
  </el-container>
</template>

<script>
export default {
  name: 'MainPage'
}
</script>

<style scoped>
.display {
  /*width: 100%;*/
  height: 90vh;
  border: 0;
  background-color: #242424;
  color: white;
}
.display:hover {
  transform: scale(1.1);
  transition: all 0.3s;
}
.el-container {
  height: 100%;
  width: 100%;
  background: url('/3.jpg');
  background-size: cover;
}
.container {
  margin-top: 5vh;
  width: 100%;
}
</style>
