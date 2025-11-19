<template>
  <div class="rich-text-editor">
    <div 
      ref="editor" 
      class="editor-container"
      contenteditable="true"
      @paste="handlePaste"
      @input="handleInput"
      @blur="handleBlur"
      @keydown="handleKeydown"
      :placeholder="placeholder"
    ></div>
  </div>
</template>

<script>
import { uploadImage } from '@/api/admin/admin_resource_manage_api'
import { convertImagePaths } from '@/utils/imageUtils'

export default {
  name: 'RichTextEditor',
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: '请输入内容...'
    },
    height: {
      type: String,
      default: '200px'
    },
    fieldName: {
      type: String,
      default: 'unknown'
    }
  },
  data() {
    return {
      content: '',
      isProcessing: false
    }
  },
  watch: {
    // 监听value prop的变化，同步到内部content
    value: {
      handler(newVal) {
        if (newVal !== this.content) {
          this.content = newVal
          if (this.$refs.editor) {
            // 使用 setContent 方法来正确处理 Markdown 格式的图片
            this.setContent(newVal)
          }
          console.log(`[${this.fieldName}] 外部值变化:`, newVal)
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.content = this.value
    if (this.$refs.editor) {
      // 使用 setContent 方法来正确处理 Markdown 格式的图片
      this.setContent(this.value)
    }
    console.log(`[${this.fieldName}] 初始化值:`, this.value)
  },
  methods: {
    // 处理输入事件
    handleInput(event) {
      console.log(`[${this.fieldName}] event:`, event)
      console.log(`[${this.fieldName}] this.$refs.editor:`, this.$refs.editor)
      console.log(`[${this.fieldName}] this.$refs.editor.innerHTML:`, this.$refs.editor.innerHTML)
      console.log(`[${this.fieldName}] typeof this.$refs.editor.innerHTML:`, typeof this.$refs.editor.innerHTML)
      
      const newContent = this.$refs.editor.innerHTML
      this.content = newContent
      
      console.log(`[${this.fieldName}] this.content:`, this.content)
      console.log(`[${this.fieldName}] typeof this.content:`, typeof this.content)
      
      this.$emit('input', this.content)
      this.$emit('change', this.content)
      
      console.log(`[${this.fieldName}] 当前值:`, this.content)
    },
    
    // 处理失焦事件
    handleBlur(event) {
      console.log(`[${this.fieldName}] blur event:`, event)
      console.log(`[${this.fieldName}] this.$refs.editor:`, this.$refs.editor)
      console.log(`[${this.fieldName}] this.$refs.editor.innerHTML:`, this.$refs.editor.innerHTML)
      console.log(`[${this.fieldName}] typeof this.$refs.editor.innerHTML:`, typeof this.$refs.editor.innerHTML)
      
      const newContent = this.$refs.editor.innerHTML
      this.content = newContent
      
      console.log(`[${this.fieldName}] this.content:`, this.content)
      console.log(`[${this.fieldName}] typeof this.content:`, typeof this.content)
      
      this.$emit('input', this.content)
      this.$emit('change', this.content)
      this.$emit('blur', this.content)
      
      console.log(`[${this.fieldName}] 失焦值:`, this.content)
    },
    
    // 处理粘贴事件
    async handlePaste(event) {
      event.preventDefault()
      
      const clipboardData = event.clipboardData || window.clipboardData
      const items = clipboardData.items
      
      // 检查是否有图片
      let hasImage = false
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          hasImage = true
          const file = item.getAsFile()
          if (file) {
            await this.uploadAndInsertImage(file)
          }
        }
      }
      
      // 如果没有图片，处理文本内容
      if (!hasImage) {
        const text = clipboardData.getData('text/plain')
        if (text) {
          this.insertText(text)
        }
      }
    },
    
    // 处理键盘事件
    handleKeydown(event) {
      // 处理Ctrl+V
      if (event.ctrlKey && event.key === 'v') {
        // 等待粘贴事件处理
      }
    },
    
    // 插入文本
    insertText(text) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(document.createTextNode(text))
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        this.handleInput()
      }
    },
    
    // 插入元素
    insertElement(element) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        range.insertNode(element)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    },
    
    // 上传图片并插入
    async uploadAndInsertImage(file) {
      if (this.isProcessing) {
        return
      }
      
      this.isProcessing = true
      
      try {
        // 显示上传中状态
        const placeholder = document.createElement('div')
        placeholder.innerHTML = '🔄 上传中...'
        placeholder.style.color = '#999'
        placeholder.style.fontStyle = 'italic'
        placeholder.style.backgroundColor = '#f0f0f0'
        placeholder.style.padding = '8px 12px'
        placeholder.style.borderRadius = '4px'
        placeholder.style.border = '1px dashed #ccc'
        placeholder.style.textAlign = 'center'
        placeholder.style.margin = '8px 0'
        
        this.insertElement(placeholder)
        
        // 创建FormData
        const formData = new FormData()
        formData.append('file', file)
        
        // 上传图片（使用管理员的API，因为教师端的暂时不支持）
        const response = await uploadImage(formData)
        
        if (response.success) {
          // 处理图片URL，确保指向8080端口
          let imageUrl = response.data
          
          // 如果返回的是相对路径，添加后端服务器地址
          if (imageUrl.startsWith('/')) {
            imageUrl = 'http://localhost:8080' + imageUrl
          }
          
          // 如果URL包含5173端口，替换为8080端口
          if (imageUrl.includes(':5173')) {
            imageUrl = imageUrl.replace(':5173', ':8080')
          }
          
          // 创建实际的img元素显示图片
          const imgElement = document.createElement('img')
          imgElement.src = imageUrl
          imgElement.alt = '粘贴的图片'
          imgElement.style.maxWidth = '100%'
          imgElement.style.height = 'auto'
          imgElement.style.display = 'block'
          imgElement.style.margin = '8px 0'
          imgElement.style.borderRadius = '4px'
          imgElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
          
          // 添加错误处理
          imgElement.onerror = () => {
            imgElement.alt = '图片加载失败'
            imgElement.style.border = '1px solid #f56c6c'
            imgElement.style.color = '#f56c6c'
          }
          
          // 替换占位符为实际的图片元素
          placeholder.replaceWith(imgElement)
        } else {
          // 上传失败，替换为错误信息
          placeholder.innerHTML = '❌ 图片上传失败'
          placeholder.style.color = '#f56c6c'
        }
      } catch (error) {
        console.error(`[${this.fieldName}] 图片上传失败:`, error)
        // 替换为错误信息
        const placeholder = document.querySelector('div[style*="上传中"]')
        if (placeholder) {
          placeholder.innerHTML = '❌ 图片上传失败'
          placeholder.style.color = '#f56c6c'
        }
      } finally {
        this.isProcessing = false
        this.handleInput() // 触发内容更新
      }
    },
    
    // 获取内容 - 将img标签转换为markdown格式
    getContent() {
      let content = this.$refs.editor.innerHTML
      
      // 将img标签转换为markdown格式
      content = content.replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
      content = content.replace(/<img[^>]+src="([^"]+)"[^>]*>/g, '![图片]($1)')
      
      return content
    },
    
    // 设置内容 - 将markdown格式转换为img标签
    setContent(content) {
      this.content = content
      
      // 先处理图片路径，确保指向8080端口
      let processedContent = convertImagePaths(content)
      
      // 将markdown格式的图片转换为img标签
      let htmlContent = processedContent
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block; margin: 8px 0; border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">')
        .replace(/\n/g, '<br>')
      
      this.$refs.editor.innerHTML = htmlContent
    },
    
    // 清空内容
    clear() {
      this.content = ''
      this.$refs.editor.innerHTML = ''
    }
  }
}
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-container {
  min-height: v-bind(height);
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.editor-container:empty::before {
  content: attr(placeholder);
  color: #c0c4cc;
  font-style: italic;
}

.editor-container:focus {
  border-color: #409eff;
}

/* 图片样式 */
:deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

:deep(img:hover) {
  opacity: 0.8;
  transform: scale(1.02);
  transition: all 0.2s ease;
}
</style>

