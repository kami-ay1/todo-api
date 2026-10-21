<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api'
import type { Todo, TodoPage } from '../api'

const page = ref<TodoPage>({ data: [], total: 0, page: 1, pageSize: 5, totalPages: 0 })
const currentPage = ref(1)
const filter = ref<'all' | 'pending' | 'done'>('all')
const order = ref('desc')
const sortBy = ref('createdAt')
const pageSize = ref(5)
const title = ref('')
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const selected = ref<Todo | null>(null)
const dialogMode = ref<'edit' | 'delete'>('edit')
const editTitle = ref('')
const dialog = ref<HTMLDialogElement | null>(null)
let latestRequest = 0
const filterName = computed(() => ({ all: '全部任务', pending: '待完成', done: '已完成' })[filter.value])

async function load() {
  const requestId = ++latestRequest
  loading.value = true
  error.value = ''
  const query = new URLSearchParams({
    page: String(currentPage.value), pageSize: String(pageSize.value), sortBy: sortBy.value, order: order.value,
  })
  if (filter.value !== 'all') query.set('done', String(filter.value === 'done'))
  try {
    const result = await listTodos(query)
    // 丢弃较早请求的响应，避免快速切换筛选时覆盖新结果。
    if (requestId !== latestRequest) return
    if (!result.ok) {
      error.value = result.message
      return
    }
    page.value = result.data
    if (currentPage.value > Math.max(1, result.data.totalPages)) currentPage.value = Math.max(1, result.data.totalPages)
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

async function add() {
  if (!title.value.trim()) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await createTodo(title.value.trim())
    if (!result.ok) {
      error.value = result.message
      return
    }
    title.value = ''
    notice.value = '已添加任务，为今天留下一小步。'
    if (currentPage.value !== 1) currentPage.value = 1
    else await load()
  } finally {
    busy.value = false
  }
}

async function toggle(todo: Todo) {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await updateTodo(todo.id, { done: !todo.done })
    if (!result.ok) { error.value = result.message; return }
    notice.value = todo.done ? '任务已恢复为待完成。' : '又完成一件事，做得很好。'
    await load()
  } finally {
    busy.value = false
  }
}

function openDialog(todo: Todo, mode: 'edit' | 'delete') {
  selected.value = todo
  dialogMode.value = mode
  editTitle.value = todo.title
  error.value = ''
  dialog.value?.showModal()
}

async function confirmDialog() {
  if (!selected.value || (dialogMode.value === 'edit' && !editTitle.value.trim())) return
  busy.value = true
  error.value = ''
  try {
    const result = dialogMode.value === 'edit'
      ? await updateTodo(selected.value.id, { title: editTitle.value.trim() })
      : await deleteTodo(selected.value.id)
    if (!result.ok) { error.value = result.message; return }
    notice.value = dialogMode.value === 'edit' ? '任务标题已更新。' : '任务已删除。'
    dialog.value?.close()
    await load()
  } finally {
    busy.value = false
  }
}

watch([filter, order, sortBy, pageSize], () => {
  notice.value = ''
  if (currentPage.value !== 1) currentPage.value = 1
  else void load()
})
watch(currentPage, load)
onMounted(load)
</script>

<template>
  <section class="task-board" aria-labelledby="task-heading">
    <div class="section-heading"><div><span class="eyebrow">MAKE ROOM FOR WHAT MATTERS</span><h2 id="task-heading">我的任务<span class="count-badge">{{ page.total }}</span></h2></div><button class="text-button" :disabled="loading || busy" @click="load">↻ 刷新</button></div>
    <form class="task-composer" @submit.prevent="add">
      <span class="composer-plus" aria-hidden="true">＋</span>
      <input v-model="title" aria-label="新任务标题" placeholder="有什么想完成的事情？" required maxlength="500" :disabled="busy" />
      <button class="button primary" :disabled="busy || !title.trim()">添加任务 <span aria-hidden="true">↗</span></button>
    </form>
    <div class="task-toolbar">
      <div class="segmented filter-tabs" aria-label="任务筛选">
        <button :aria-pressed="filter === 'all'" :disabled="busy" @click="filter = 'all'">全部任务</button>
        <button :aria-pressed="filter === 'pending'" :disabled="busy" @click="filter = 'pending'">待完成</button>
        <button :aria-pressed="filter === 'done'" :disabled="busy" @click="filter = 'done'">已完成</button>
      </div>
      <div class="sort-controls"><select v-model="sortBy" aria-label="排序字段" :disabled="busy"><option value="createdAt">按创建时间</option><option value="done">按完成状态</option></select><select v-model="order" aria-label="排序方向" :disabled="busy"><option value="desc">降序 ↓</option><option value="asc">升序 ↑</option></select></div>
    </div>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <p v-if="notice" class="success-message" role="status">{{ notice }}</p>
    <div class="task-list" :aria-busy="loading">
      <div v-if="loading" class="empty-state"><span class="loading-dot"></span><p>正在整理你的清单…</p></div>
      <template v-else-if="page.data.length">
        <article v-for="(todo, index) in page.data" :key="todo.id" class="task-row" :class="{ completed: todo.done }" :style="{ '--row-index': index }">
          <button class="task-check" :aria-label="`${todo.done ? '恢复任务' : '完成任务'}：${todo.title}`" :aria-pressed="todo.done" :disabled="busy" @click="toggle(todo)"><span v-if="todo.done" aria-hidden="true">✓</span></button>
          <div class="task-copy"><h3>{{ todo.title }}</h3><span>{{ new Date(todo.createdAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }}创建</span></div>
          <span class="status-tag" :class="{ done: todo.done }">{{ todo.done ? '已完成' : '待完成' }}</span>
          <div class="row-actions"><button class="icon-button" :aria-label="`编辑任务：${todo.title}`" :disabled="busy" @click="openDialog(todo, 'edit')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" /></svg></button><button class="icon-button delete-button" :aria-label="`删除任务：${todo.title}`" :disabled="busy" @click="openDialog(todo, 'delete')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></svg></button></div>
        </article>
      </template>
      <div v-else class="empty-state"><div class="empty-symbol" aria-hidden="true">✓</div><h3>{{ filter === 'done' ? '完成的事情，会在这里相遇' : filter === 'pending' ? '清单已清空，享受这份轻松' : '给今天一个小小的开始' }}</h3><p>{{ filter === 'all' ? '在上方记下第一件想完成的事情。' : '可以切换筛选，查看其他任务。' }}</p></div>
    </div>
    <footer class="pagination"><span>{{ filterName }} · 共 {{ page.total }} 项</span><div class="page-controls"><select v-model="pageSize" aria-label="每页条数" :disabled="busy || loading"><option :value="5">5 项 / 页</option><option :value="10">10 项 / 页</option><option :value="20">20 项 / 页</option></select><button class="icon-button" aria-label="上一页" :disabled="currentPage <= 1 || loading || busy" @click="currentPage--">←</button><span>{{ currentPage }} / {{ Math.max(1, page.totalPages) }}</span><button class="icon-button" aria-label="下一页" :disabled="currentPage >= page.totalPages || loading || busy" @click="currentPage++">→</button></div></footer>
    <dialog ref="dialog" class="task-dialog" aria-labelledby="dialog-heading" @cancel="busy && $event.preventDefault()">
      <form @submit.prevent="confirmDialog"><span class="eyebrow">A MOMENT TO ORGANIZE</span><h2 id="dialog-heading">{{ dialogMode === 'edit' ? '编辑任务' : '删除这项任务？' }}</h2><template v-if="dialogMode === 'edit'"><label for="edit-title">任务标题</label><input id="edit-title" v-model="editTitle" required maxlength="500" :disabled="busy" /></template><p v-else class="delete-description">“{{ selected?.title }}”将被永久删除。</p><p v-if="error" class="error-message" role="alert">{{ error }}</p><div class="dialog-actions"><button type="button" class="button secondary" :disabled="busy" @click="dialog?.close()">取消</button><button class="button" :class="dialogMode === 'edit' ? 'primary' : 'danger'" :disabled="busy || (dialogMode === 'edit' && !editTitle.trim())">{{ busy ? '正在处理…' : dialogMode === 'edit' ? '保存修改' : '确认删除' }}</button></div></form>
    </dialog>
  </section>
</template>
