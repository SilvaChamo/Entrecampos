const fs = require('fs');
const path = require('path');

// Read XML file
const xmlPath = '/Users/macbook/BackUp/——— BackUp/—— WEB/___ SITES/EntreCAMPOS/— BACKUP/entrecampos.WordPress.2026-04-21 (1).xml';
const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

// Parse basic info
const titleMatch = xmlContent.match(/<title>(.*?)<\/title>/);
const linkMatch = xmlContent.match(/<link>(.*?)<\/link>/);

// Count items
const posts = xmlContent.match(/<wp:post_type><!\[CDATA\[post\]\]><\/wp:post_type>/g) || [];
const pages = xmlContent.match(/<wp:post_type><!\[CDATA\[page\]\]><\/wp:post_type>/g) || [];
const attachments = xmlContent.match(/<wp:post_type><!\[CDATA\[attachment\]\]><\/wp:post_type>/g) || [];

// Extract categories
const categoryMatches = xmlContent.matchAll(/<wp:category>\s*<wp:term_id>(\d+)<\/wp:term_id>\s*<wp:category_nicename><!\[CDATA\[(.*?)\]\]><\/wp:category_nicename>\s*<wp:category_parent><!\[CDATA\[(.*?)\]\]><\/wp:category_parent>\s*<wp:cat_name><!\[CDATA\[(.*?)\]\]><\/wp:cat_name>/g);

const categories = [];
for (const match of categoryMatches) {
  categories.push({
    id: match[1],
    slug: match[2],
    parent: match[3] || null,
    name: match[4]
  });
}

// Extract posts with details
const itemMatches = xmlContent.matchAll(/<item>[\s\S]*?<\/item>/g);
const postsData = [];
const pagesData = [];
const imagesData = [];

for (const itemMatch of itemMatches) {
  const item = itemMatch[0];
  
  const postType = item.match(/<wp:post_type><!\[CDATA\[(.*?)\]\]><\/wp:post_type>/);
  if (!postType) continue;
  
  const type = postType[1];
  const title = (item.match(/<title>(.*?)<\/title>/) || ['', ''])[1];
  const link = (item.match(/<link>(.*?)<\/link>/) || ['', ''])[1];
  const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || ['', ''])[1];
  const content = (item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/) || ['', ''])[1];
  const excerpt = (item.match(/<excerpt:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/excerpt:encoded>/) || ['', ''])[1];
  const slug = (item.match(/<wp:post_name><!\[CDATA\[(.*?)\]\]><\/wp:post_name>/) || ['', ''])[1];
  const author = (item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/) || ['', ''])[1];
  
  // Extract category for posts
  const categoryMatch = item.match(/<category domain="category" nicename="(.*?)"><!\[CDATA\[(.*?)\]\]><\/category>/);
  const category = categoryMatch ? categoryMatch[2] : '';
  
  if (type === 'post') {
    const postId = (item.match(/<wp:post_id>(\d+)<\/wp:post_id>/) || ['', ''])[1];
    postsData.push({ title, link, pubDate, content: content.substring(0, 200) + '...', excerpt, slug, author, category, postId, images: [] });
  } else if (type === 'page') {
    pagesData.push({ title, link, slug, content: content.substring(0, 200) + '...' });
  } else if (type === 'attachment') {
    const url = (item.match(/<wp:attachment_url>(.*?)<\/wp:attachment_url>/) || ['', ''])[1];
    const parentId = (item.match(/<wp:post_parent>(\d+)<\/wp:post_parent>/) || ['', ''])[1];
    imagesData.push({ title, url, parentId });
  }
}

// Associate images to posts
imagesData.forEach((image) => {
  if (image.parentId) {
    const post = postsData.find((p) => p.postId === image.parentId);
    if (post) {
      if (!post.images) post.images = [];
      post.images.push(image.url);
    }
  }
});

// Add default images for posts without images
postsData.forEach((post) => {
  if (!post.images || post.images.length === 0) {
    post.images = ['https://entrecampos.co.mz/wp-content/uploads/2021/06/CAMPANHAAGRICOLA.jpg'];
  }
});

// Create analysis result
const analysis = {
  site: {
    title: titleMatch ? titleMatch[1] : '',
    link: linkMatch ? linkMatch[1] : '',
    exportDate: '2026-04-21'
  },
  summary: {
    totalPosts: posts.length,
    totalPages: pages.length,
    totalImages: attachments.length,
    totalCategories: categories.length
  },
  categories: categories,
  posts: postsData.slice(0, 10), // First 10 posts
  pages: pagesData.slice(0, 5),   // First 5 pages
  images: imagesData.slice(0, 10) // First 10 images
};

// Save analysis
fs.writeFileSync(
  '/Users/macbook/Desktop/APP/entrecampos/analise-xml.json',
  JSON.stringify(analysis, null, 2)
);

// Save full data
fs.writeFileSync(
  '/Users/macbook/Desktop/APP/entrecampos/data/posts.json',
  JSON.stringify(postsData, null, 2)
);
fs.writeFileSync(
  '/Users/macbook/Desktop/APP/entrecampos/data/pages.json',
  JSON.stringify(pagesData, null, 2)
);
fs.writeFileSync(
  '/Users/macbook/Desktop/APP/entrecampos/data/images.json',
  JSON.stringify(imagesData, null, 2)
);

console.log('✅ Análise concluída!');
console.log(`📊 Resumo:`);
console.log(`   - Posts: ${posts.length}`);
console.log(`   - Páginas: ${pages.length}`);
console.log(`   - Imagens: ${attachments.length}`);
console.log(`   - Categorias: ${categories.length}`);
console.log('');
console.log('📁 Arquivos gerados:');
console.log('   - analise-xml.json');
console.log('   - data/posts.json');
console.log('   - data/pages.json');
console.log('   - data/images.json');
