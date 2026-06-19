const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.db.collection('projects').dropIndex('shareToken_1');
  console.log('✅ Index dropped!');
  process.exit();
}).catch(err => {
  console.log('❌ Error:', err.message);
  process.exit();
});