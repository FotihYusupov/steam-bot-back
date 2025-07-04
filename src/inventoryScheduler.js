const User = require('./models/User');
const updateInventoryForUser = require('./utils/updateInventory');

async function startInventoryScheduler() {
  const users = await User.find({ steamId64: { $exists: true } });
  let index = 0;
  let isRunning = false;

  async function processNextUser() {
    if (isRunning) return;
    isRunning = true;

    if(users.length) {
      if (index >= users.length) index = 0;
      const user = users[index];

      console.log(`${new Date()} 🔄 ${user.username || user._id} uchun inventar yangilanmoqda`);
      await updateInventoryForUser(user);
      index++;

      isRunning = false;
      setTimeout(processNextUser, 60000);
    }
  }

  console.log('🔁 Scheduler started');
  processNextUser();
}

startInventoryScheduler();
