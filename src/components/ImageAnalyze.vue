<template>
  <el-container>
    <el-aside style="width: 30%">
      <el-row>
        <el-col :span="24">
          <el-image :src="img_ref" style="width: 100%; height: 300px" fit="contain">
            <template #error></template>
          </el-image>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-upload
            drag
            :auto-upload="false"
            :on-change="handleChange"
            :limit="1"
            :on-exceed="handleExceed"
            ref="upload"
            :show-file-list="false"
          >
            <el-icon class="el-icon--upload">
              <upload-filled />
            </el-icon>
            <div class="el-upload__text">将图片拖到这里或<em>点击上传图片</em></div>
            <template #tip>
              <div class="el-upload__tip">仅支持jpg/jpeg格式图片</div>
            </template>
          </el-upload>
        </el-col>
      </el-row>
      <el-row>
        <transition name="el-fade-in-linear">
          <el-col :span="24" v-show="img_data">
            <el-descriptions size="large" :column="2" border>
              <el-descriptions-item>
                <template #label>
                  <div class="cell-item">
                    <el-icon>
                      <Clock />
                    </el-icon>
                    拍摄时间
                  </div>
                </template>
                {{ img_data?.DateTime }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label>
                  <div class="cell-item">
                    <el-icon><Camera /></el-icon>
                  </div>
                  拍摄设备
                </template>
                {{ img_data?.Make }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label>
                  <div class="cell-item">
                    <el-icon><Monitor /></el-icon>
                  </div>
                  设备型号
                </template>
                {{ img_data?.Model }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label>
                  <div class="cell-item">
                    <el-icon><InfoFilled /></el-icon>
                  </div>
                  系统版本
                </template>
                {{ img_data?.Software }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label>
                  <div class="cell-item">
                    <el-icon><Coordinate /></el-icon>
                  </div>
                  经纬度坐标
                </template>
                {{
                  `${coor_mapping[img_data?.GPSLatitudeRef]}${img_data?.GPSLatitude[0]}度${
                    img_data?.GPSLatitude[1]
                  }分${img_data?.GPSLatitude[2]}秒；${coor_mapping[img_data?.GPSLongitudeRef]}${
                    img_data?.GPSLongitude[0]
                  }度${img_data?.GPSLongitude[1]}分${img_data?.GPSLongitude[2]}秒`
                }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label>
                  <div class="cell-item">
                    <el-icon><Position /></el-icon>
                  </div>
                  海拔高度
                </template>
                {{ `${img_data?.GPSAltitudeRef === 0 ? '' : '负'}${img_data?.GPSAltitude}米` }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </transition>
      </el-row>
    </el-aside>
    <el-main style="width: 70%">
      <el-row :gutter="20">
        <el-col :span="12"><div id="earth" ref="earth_ref"></div></el-col>
        <el-col :span="12"><div id="map" style="height: 100%; width: 100%"></div></el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { update } from '@tweenjs/tween.js'
import { onMounted, ref } from 'vue'
import { Earth } from '../scripts/earth'
import EXIF from '../outer_script/exif'
import { genFileId, UploadInstance, UploadProps, UploadRawFile } from 'element-plus'
import {
  UploadFilled,
  Clock,
  Camera,
  Coordinate,
  Position,
  Monitor,
  InfoFilled
} from '@element-plus/icons-vue'

const coor_mapping = { E: '东经', W: '西经', N: '北纬', S: '南纬' }

const prop_filter = [
  'DateTime',
  'GPSAltitude',
  'GPSAltitudeRef',
  'GPSLatitude',
  'GPSLatitudeRef',
  'GPSLongitude',
  'GPSLongitudeRef',
  'GPSSpeed',
  'GPSSpeedRef',
  'Make',
  'Model',
  'Orientation',
  'Software'
]

interface image_props {
  DateTime: string
  GPSAltitude: number
  GPSAltitudeRef: number
  GPSLatitude: Array<number>
  GPSLatitudeRef: string
  GPSLongitude: Array<number>
  GPSLongitudeRef: string
  GPSSpeed: number
  GPSSpeedRef: string
  Make: string
  Model: string
  Orientation: number
  Software: string
}

const earth_ref = ref()
let img_ref = ref('')
let img_data = ref<image_props>()
let earth = new Earth()
const map_ref = ref()
onMounted(() => {
  const map = new window.BMapGL.Map('map')
  let point = new window.BMapGL.Point(116.404, 39.915)
  map_ref.value = map
  map.centerAndZoom(point, 15)
  earth_ref.value.appendChild(earth.renderer.domElement)
  animate()
})

const animate = () => {
  requestAnimationFrame(() => {
    earth.animate()
    animate()
    update()
  })
}

const upload = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value?.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value?.handleStart(file)
}

const handleChange: UploadProps['onChange'] = (uploadFile) => {
  const file = uploadFile.raw as File
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    img_ref.value = e.target?.result as string
  }
  EXIF.getData(file, function (data: { exifdata: never }) {
    let extract: image_props = {} as image_props
    Object.keys(data.exifdata).forEach((k) => {
      if (prop_filter.includes(k)) extract[k as keyof image_props] = data.exifdata[k]
    })
    img_data.value = { ...extract }
    handlePoint()
  })
}

// const handleRotate = () => {
//   const x = img_data.value?.GPSLongitude
//   const y = img_data.value?.GPSLatitude
// }

const handlePoint = () => {
  const trans_cbk = (data: any) => {
    if (data.status === 0) {
      const mark = new window.BMapGL.Marker(data.points[0])
      map_ref.value.addOverlay(mark)
      map_ref.value.setCenter(data.points[0])
      map_ref.value.setZoom(18)
    }
  }
  const convert = new window.BMapGL.Convertor()
  const geo = new window.BMapGL.Geocoder()
  let point_arr = []
  const x = img_data.value?.GPSLongitude
  const y = img_data.value?.GPSLatitude
  const point = new window.BMapGL.Point(
    (x as Array<number>)[0] + (x as Array<number>)[1] / 60 + (x as Array<number>)[2] / 3600,
    (y as Array<number>)[0] + (y as Array<number>)[1] / 60 + (y as Array<number>)[2] / 3600
  )
  point_arr.push(point)
  geo.getLocation(point, (result: never) => {
    if (result) {
      console.log(result)
    }
  })
  convert.translate(point_arr, 1, 5, trans_cbk)
}
</script>

<style scoped>
.el-container {
  height: 100%;
  width: 100%;
}

.el-aside {
  height: 100%;
  width: 30%;
}

.el-main {
  height: 100%;
  width: 70%;
  padding: 0;
  margin: 0;
}

.earth {
  height: 100%;
  width: 100%;
}
</style>
