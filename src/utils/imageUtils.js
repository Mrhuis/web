/**
 * 图片路径处理工具
 */

/**
 * 将相对路径的图片转换为后端静态资源URL（用于显示）
 * @param {string} content - 包含图片路径的内容
 * @returns {string} - 转换后的内容
 */
export function convertImagePaths(content) {
  if (!content) return content;
  const isDev = typeof location !== 'undefined' && (location.port === '5137' || location.hostname === 'localhost');
  const staticHost = isDev ? 'http://localhost:8080' : '';
  // 处理相对路径的图片 ![alt](./path/to/image.png)
  const relativeImageRegex = /!\[([^\]]*)\]\(\.\/([^)]+)\)/g;
  let processedContent = content.replace(relativeImageRegex, (match, alt, imagePath) => {
    let backendImageUrl;
    if (imagePath.startsWith('items/')) {
      backendImageUrl = `${staticHost}/items/${imagePath.substring(6)}`;
    } else {
      backendImageUrl = `${staticHost}/media/${imagePath}`;
    }
    return `![${alt}](${backendImageUrl})`;
  });
  // 处理绝对路径的图片 ![alt](/items/path/to/image.png)
  const absoluteImageRegex = /!\[([^\]]*)\]\(\/([^)]+)\)/g;
  processedContent = processedContent.replace(absoluteImageRegex, (match, alt, imagePath) => {
    const fullUrl = `${staticHost}/${imagePath}`;
    return `![${alt}](${fullUrl})`;
  });
  return processedContent;
}

/**
 * 将完整URL的图片转换为相对路径（用于存储）
 * @param {string} content - 包含图片路径的内容
 * @returns {string} - 转换后的内容
 */
export function convertToRelativePaths(content) {
  if (!content) return content;
  
  // 处理完整URL的图片 ![alt](http://localhost:8080/items/path/to/image.png)
  const fullUrlRegex = /!\[([^\]]*)\]\(http:\/\/localhost:8080\/([^)]+)\)/g;
  let processedContent = content.replace(fullUrlRegex, (match, alt, imagePath) => {
    console.log(`🔄 转换完整URL为相对路径: ${imagePath}`, {
      originalUrl: `http://localhost:8080/${imagePath}`,
      relativePath: `/${imagePath}`,
      timestamp: new Date().toISOString()
    });
    
    return `![${alt}](/${imagePath})`;
  });
  
  return processedContent;
}

/**
 * 处理HTML内容中的图片路径
 * @param {string} htmlContent - HTML内容
 * @returns {string} - 转换后的HTML内容
 */
export function convertHtmlImagePaths(htmlContent) {
  if (!htmlContent) return htmlContent;
  const isDev = typeof location !== 'undefined' && (location.port === '5137' || location.hostname === 'localhost');
  const staticHost = isDev ? 'http://localhost:8080' : '';
  // 匹配 <img src="./path/to/image.png"> 格式
  const imgRegex = /<img([^>]*)\ssrc="\.\/([^"]+)"/g;
  return htmlContent.replace(imgRegex, (match, attributes, imagePath) => {
    let backendImageUrl;
    if (imagePath.startsWith('items/')) {
      backendImageUrl = `${staticHost}/items/${imagePath.substring(6)}`;
    } else {
      backendImageUrl = `${staticHost}/media/${imagePath}`;
    }
    return `<img${attributes} src="${backendImageUrl}"`;
  });
}

/**
 * 处理内容中的图片路径（支持Markdown和HTML格式）
 * @param {string} content - 内容
 * @returns {string} - 转换后的内容
 */
export function processImagePaths(content) {
  if (!content) return content;
  
  // 处理相对路径的Markdown图片
  let processedContent = convertImagePaths(content);
  
  // 处理相对路径的HTML图片
  processedContent = convertHtmlImagePaths(processedContent);
  
  return processedContent;
} 