<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { apiUrl, uploadFile } from '../api'
import type { Upload } from '../api'

const input = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const error = ref('')
const uploaded = ref<Upload | null>(null)
const previewUrl = ref('')
const fileUrl = computed(() => uploaded.value ? new URL(uploaded.value.url, apiUrl).href : '')

async function upload() {
  const file = input.value?.files?.[0]
  if (!file) return
  error.value = ''
  uploaded.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    error.value = '请选择 PNG 或 JPEG 图片。'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = '图片不能超过 5MB。'
    return
  }
  busy.value = true
  try {
    const result = await uploadFile(file)
    if (!result.ok) { error.value = result.message; return }
    // 从真实文件访问接口读取内容，使用声明的 MIME 类型显示图片。
    const response = await fetch(new URL(result.data.url, apiUrl))
    if (!response.ok) { error.value = `文件读取失败（${response.status}）`; return }
    const bytes = await response.arrayBuffer()
    previewUrl.value = URL.createObjectURL(new Blob([bytes], { type: result.data.mimetype }))
    uploaded.value = result.data
  } finally {
    busy.value = false
    if (input.value) input.value.value = ''
  }
}

onBeforeUnmount(() => { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value) })
</script>

<template>
  <section class="upload-panel" aria-labelledby="upload-heading">
    <div class="upload-heading">
      <span class="eyebrow">LITTLE INSPIRATIONS</span>
      <h2 id="upload-heading">留存一份灵感 <span aria-hidden="true">↗</span></h2>
    </div>
    <p class="muted">一张图片，也可以是开始的动力。</p>
    <button class="upload-drop" :disabled="busy" @click="input?.click()">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="5" width="24" height="22" rx="4" />
        <circle cx="11" cy="12" r="2" />
        <path d="m4 23 8-7 5 5 5-9 6 11" />
      </svg>
      <strong>{{ busy ? '正在上传…' : '选择一张图片' }}</strong>
      <span>PNG / JPEG · 最大 5MB</span>
    </button>
    <input ref="input" class="visually-hidden" type="file" accept="image/png,image/jpeg" aria-label="上传图片" :disabled="busy" @change="upload" />
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <div v-if="uploaded" class="upload-result">
      <img :src="previewUrl" :alt="uploaded.originalName" />
      <div>
        <strong>{{ uploaded.originalName }}</strong>
        <span>{{ (uploaded.size / 1024).toFixed(1) }} KB · 上传成功</span>
        <a :href="fileUrl" target="_blank" rel="noopener noreferrer">打开文件 ↗</a>
      </div>
    </div>
    <p class="upload-note">图片独立保存，不会自动关联到任务。</p>
  </section>
</template>
