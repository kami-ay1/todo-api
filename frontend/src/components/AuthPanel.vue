<script setup lang="ts">
import { ref } from 'vue'
import { login, register } from '../api'

const emit = defineEmits<{
  authenticated: [username: string, token: string]
}>()
const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const busy = ref(false)
const message = ref('')

async function submit() {
  message.value = ''
  if (!username.value.trim()) {
    message.value = '请输入有效的用户名。'
    return
  }
  busy.value = true
  try {
    if (mode.value === 'register') {
      const registered = await register(username.value.trim(), password.value)
      if (!registered.ok) {
        message.value = registered.message
        return
      }
    }
    const result = await login(username.value.trim(), password.value)
    if (!result.ok) {
      message.value = result.message
      return
    }
    emit('authenticated', username.value.trim(), result.data.token)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="auth-layout" aria-label="账号登录">
    <div class="auth-story">
      <span class="eyebrow">A LITTLE SPACE, A CLEARER DAY</span>
      <h1>把今天，<br />理清楚<span class="accent-dot">。</span></h1>
      <p>记下脑海中的小事，<br />为真正重要的事情留出空间。</p>
      <div class="paper-art" aria-hidden="true">
        <div class="paper-back"></div>
        <div class="paper-front">
          <span class="paper-date">ONE THING AT A TIME</span>
          <div class="art-line"><span class="art-check">✓</span><i></i></div>
          <div class="art-line"><span class="art-check">✓</span><i></i></div>
          <div class="art-line"><span class="art-circle"></span><i></i></div>
          <span class="paper-note">每一小步，都算数。</span>
        </div>
        <span class="art-sticker">慢慢来<br />也很好</span>
      </div>
      <span class="story-footer">少一点纷乱，多一点从容。</span>
    </div>
    <div class="auth-card">
      <span class="eyebrow">YOUR PERSONAL DAYBOOK</span>
      <h2>{{ mode === 'login' ? '欢迎回来' : '开启你的有序日常' }}</h2>
      <p class="muted">{{ mode === 'login' ? '登录，继续你的每一小步。' : '创建账号，拥有自己的任务清单。' }}</p>
      <div class="segmented auth-tabs" aria-label="账号操作">
        <button type="button" :aria-pressed="mode === 'login'" :disabled="busy" @click="mode = 'login'; message = ''">登录</button>
        <button type="button" :aria-pressed="mode === 'register'" :disabled="busy" @click="mode = 'register'; message = ''">注册账号</button>
      </div>
      <form class="auth-form" @submit.prevent="submit">
        <label for="username">用户名</label>
        <input id="username" v-model="username" name="username" autocomplete="username" placeholder="输入你的用户名" required maxlength="80" :disabled="busy" />
        <label for="password">密码</label>
        <input id="password" v-model="password" name="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" placeholder="输入你的密码" required :disabled="busy" />
        <p v-if="message" class="error-message" role="alert">{{ message }}</p>
        <button class="button primary auth-submit" :disabled="busy">{{ busy ? '正在处理…' : mode === 'login' ? '登录拾序 →' : '创建账号并登录 →' }}</button>
      </form>
      <p class="auth-footnote">你的任务清单，仅对登录后的你可见。</p>
    </div>
  </section>
</template>
