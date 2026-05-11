const fs = require('fs');

try {
  const data = fs.readFileSync('/Users/KoushikVarakala/.gemini/antigravity/brain/0917b665-fd37-4e44-8903-b277903b295c/media__1778525826511.png');
  fs.writeFileSync('public/logo.png', data);
  console.log('Success');
} catch (e) {
  console.error(e);
}
