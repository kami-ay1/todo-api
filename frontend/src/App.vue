<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AuthPanel from './components/AuthPanel.vue'
import TaskBoard from './components/TaskBoard.vue'
import UploadPanel from './components/UploadPanel.vue'

const token = ref(sessionStorage.getItem('todo.token'))
const username = ref(sessionStorage.getItem('todo.username') ?? '')
const sessionMessage = ref('')
const today = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())

function authenticated(name: string, value: string) {
  sessionStorage.setItem('todo.token', value)
  sessionStorage.setItem('todo.username', name)
  username.value = name
  token.value = value
  sessionMessage.value = ''
}

function logout() {
  sessionStorage.removeItem('todo.token')
  sessionStorage.removeItem('todo.username')
  token.value = null
  username.value = ''
}

function sessionExpired() {
  logout()
  sessionMessage.value = '登录已失效，请重新登录。'
}

onMounted(() => window.addEventListener('todo:session-expired', sessionExpired))
onBeforeUnmount(() => window.removeEventListener('todo:session-expired', sessionExpired))
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <a class="brand" href="/" aria-label="拾序首页">
        <span class="brand-mark" aria-hidden="true">✓</span>
        <span>拾序<span class="brand-english">DAYBOOK</span></span>
      </a>
      <span class="header-motto">把日常，过得有条有理。</span>
      <div v-if="token" class="account-menu">
        <span class="avatar">{{ username.slice(0, 1).toUpperCase() }}</span>
        <span class="account-name">{{ username }}</span>
        <button class="text-button" @click="logout">退出登录</button>
      </div>
      <span v-else class="header-label">专注当下 · 从容向前</span>
    </header>
    <main>
      <p v-if="sessionMessage" class="session-message" role="alert">{{ sessionMessage }}</p>
      <AuthPanel v-if="!token" @authenticated="authenticated" />
      <template v-else>
        <section class="welcome-banner">
          <div>
            <span class="eyebrow">{{ today }}</span>
            <h1>今天，也从一件小事开始<span class="accent-dot">。</span></h1>
            <p>清晰地记录，从容地完成。按照自己的节奏就好。</p>
          </div>
          <div class="banner-stamp" aria-hidden="true">
            <span>KEEP IT</span><strong>simple.</strong><span>ONE STEP AT A TIME</span>
          </div>
        </section>
        <div class="workspace">
          <TaskBoard />
          <aside class="side-column">
            <div class="daily-note">
              <span class="eyebrow">A GENTLE REMINDER</span>
              <span class="note-spark" aria-hidden="true">✳</span>
              <h2>不必一口气<br />完成所有事。</h2>
              <p>把注意力交给眼前的一件事，<br />每一次完成，都值得肯定。</p>
              <div class="note-rule"></div>
              <span>给努力中的自己，多一点耐心。</span>
            </div>
            <UploadPanel />
          </aside>
        </div>
      </template>
    </main>
    <footer class="app-footer">
      <span>拾序 DAYBOOK</span><span>留一点空间，给生活。</span>
      <span class="footer-end">每一小步，都算数。 <span aria-hidden="true">↗</span></span>
    </footer>
  </div>
</template>
