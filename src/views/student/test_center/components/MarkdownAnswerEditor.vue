<template>
  <div class="markdown-answer-editor">
    <div
      ref="editorRef"
      class="editor-container"
      contenteditable="true"
      :data-placeholder="placeholder"
      :style="{ minHeight: height }"
      @input="handleInput"
      @blur="handleBlur"
      @paste="handlePaste"
    ></div>
    <div class="editor-tip">支持 Markdown 语法，直接粘贴图片即可自动上传</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { uploadImage } from '@/api/admin/admin_resource_manage_api'
import { processImagePaths } from '@/utils/imageUtils'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入答案，可粘贴图片...'
  },
  height: {
    type: String,
    default: '180px'
  },
  fieldName: {
    type: String,
    default: 'answer'
  }
})

const emit = defineEmits(['update:modelValue', 'input', 'change', 'blur'])

const editorRef = ref(null)
const lastMarkdownValue = ref('')
const isUploading = ref(false)

watch(
  () => props.modelValue,
  (newVal) => {
    const value = newVal || ''
    if (value === lastMarkdownValue.value) return
    updateEditorFromMarkdown(value)
  },
  { immediate: true }
)

onMounted(() => {
  nextTick(() => {
    updateEditorFromMarkdown(props.modelValue || '')
  })
})

function handleInput() {
  emitMarkdownValue()
}

function handleBlur() {
  const markdown = emitMarkdownValue()
  emit('blur', markdown)
}

async function handlePaste(event) {
  const clipboardData = event.clipboardData || window.clipboardData
  if (!clipboardData) return

  const items = Array.from(clipboardData.items || [])
  const imageItems = items.filter((item) => item.type && item.type.includes('image'))

  if (imageItems.length === 0) {
    return
  }

  event.preventDefault()

  for (const item of imageItems) {
    const file = item.getAsFile()
    if (file) {
      await uploadAndInsertImage(file)
    }
  }

  const text = clipboardData.getData('text/plain')
  if (text) {
    insertText(text)
    emitMarkdownValue()
  }
}

async function uploadAndInsertImage(file) {
  if (isUploading.value) return
  if (!editorRef.value) return

  isUploading.value = true
  const placeholder = document.createElement('div')
  placeholder.className = 'image-placeholder'
  placeholder.textContent = '图片上传中...'
  insertNode(placeholder)

  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await uploadImage(formData)
    if (response && response.success && response.data) {
      let imageUrl = response.data
      if (imageUrl.startsWith('/')) {
        imageUrl = `http://localhost:8080${imageUrl}`
      }
      if (imageUrl.includes(':5173')) {
        imageUrl = imageUrl.replace(':5173', ':8080')
      }
      const img = document.createElement('img')
      img.src = imageUrl
      img.alt = '作答图片'
      img.className = 'answer-image'
      placeholder.replaceWith(img)
    } else {
      placeholder.textContent = '图片上传失败'
      placeholder.classList.add('error')
    }
  } catch (error) {
    console.error(`[${props.fieldName}] 图片上传失败:`, error)
    placeholder.textContent = '图片上传失败'
    placeholder.classList.add('error')
  } finally {
    isUploading.value = false
    emitMarkdownValue()
  }
}

function insertNode(node) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    editorRef.value.appendChild(node)
    return
  }
  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(node)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function insertText(text) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    editorRef.value.appendChild(document.createTextNode(text))
    return
  }
  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(document.createTextNode(text))
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
}

function emitMarkdownValue() {
  if (!editorRef.value) return ''
  const html = editorRef.value.innerHTML
  const markdown = convertHtmlToMarkdown(html)
  lastMarkdownValue.value = markdown
  emit('update:modelValue', markdown)
  emit('input', markdown)
  emit('change', markdown)
  return markdown
}

function updateEditorFromMarkdown(markdown) {
  if (!editorRef.value) return
  const processed = convertMarkdownToHtml(markdown)
  editorRef.value.innerHTML = processed
  lastMarkdownValue.value = markdown
}

function convertMarkdownToHtml(markdown) {
  if (!markdown) return ''
  const processed = processImagePaths(markdown)
  return processed
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="answer-image">')
    .replace(/\n/g, '<br>')
}

function convertHtmlToMarkdown(html) {
  if (!html) return ''
  let markdown = html
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]+)"[^>]*>/gi, '![$1]($2)')
    .replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, '![图片]($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()
  return markdown
}
</script>

<style scoped>
.markdown-answer-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  background-color: #fff;
}

.editor-container {
  width: 100%;
  outline: none;
  border: none;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.editor-container:empty::before {
  content: attr(data-placeholder);
  color: #c0c4cc;
}

.editor-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.answer-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-placeholder {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border: 1px dashed #c0c4cc;
  border-radius: 4px;
  color: #909399;
  text-align: center;
  font-size: 13px;
  margin: 8px 0;
}

.image-placeholder.error {
  color: #f56c6c;
  border-color: #f56c6c;
  background-color: #fef0f0;
}
</style>

