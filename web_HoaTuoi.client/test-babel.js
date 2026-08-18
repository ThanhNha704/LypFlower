const fs = require('fs');
const babel = require('@babel/core');
try {
  const code = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');
  babel.transformSync(code, {
    presets: ['@babel/preset-react']
  });
  console.log("No syntax errors found by babel.");
} catch(e) {
  console.error(e.message);
}
