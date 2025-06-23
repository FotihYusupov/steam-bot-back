const User = require('./models/User');
const updateInventoryForUser = require('./utils/updateInventory');

async function startInventoryScheduler() {
  const users = await User.find({ steamId64: { $exists: true } });
  let index = 0;

  setInterval(async () => {
    if (index >= users.length) index = 0;

    const user = users[index];
    await updateInventoryForUser(user);
    index++;
  }, 4000);
}

startInventoryScheduler();
