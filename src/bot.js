const TelegramBot = require("node-telegram-bot-api");
const User = require("./models/User");
const { sign } = require("./utils/jwt");

const TELEGRAM_TOKEN = "7643909829:AAGtmiIS3rx9HMR_i-4nx0vq6qBRi627lWs";
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

async function getPhoto(user_id) {
  const profilePhotos = await bot.getUserProfilePhotos(user_id, { limit: 1 });

  if (profilePhotos.total_count > 0) {
    const fileId = profilePhotos.photos[0][0].file_id;
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
    return fileUrl;
  }
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "Do‘st";

  try {
    const userUpdateData = {
      chatId: chatId,
      username: msg.from.username,
      photo: await getPhoto(msg.from.id),
    };

    const user = await User.findOneAndUpdate(
      { telegramId: msg.from.id },
      { $set: userUpdateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (user.isActive) {
      bot.sendMessage(chatId, `👋 Salom ${name} botga xush kelibsiz!`);

      const token = sign({ id: user._id });
      console.log("Generated Token:", token);

      const url = `https://steam-bot-front.vercel.app?token=${token}`;
      // bot.sendMessage(chatId, url);

      await bot.setChatMenuButton({
        chat_id: chatId,
        menu_button: JSON.stringify({
          type: "web_app",
          text: "Menu",
          web_app: {
            url: url,
          },
        }),
      });
    } else {
      const options = {
        reply_markup: {
          keyboard: [
            [{ text: "📱 Telefon raqamni yuborish", request_contact: true }],
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      };

      const welcomeMsg = `👋 Salom ${name}!\nIltimos botdan to'liq foydalanish uchun telefon raqamingizni yuboring!.`;
      bot.sendMessage(chatId, welcomeMsg, options);
    }
  } catch (err) {
    console.error("Error in /start handler:", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.telegramId) {
      bot.sendMessage(
        chatId,
        "Kechirasiz, sizning Telegram hisobingiz bilan bog'liq muammo yuz berdi. Iltimos, admin bilan bog'laning."
      );
    } else {
      bot.sendMessage(
        chatId,
        "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
      );
    }
  }
});

bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;

  if (!contact || !contact.phone_number) {
    return bot.sendMessage(
      chatId,
      "❌ Telefon raqam olinmadi. Iltimos, qayta urinib ko‘ring."
    );
  }

  try {
    const existingUserWithPhone = await User.findOne({
      phoneNumber: contact.phone_number,
      telegramId: { $ne: contact.user_id },
    });

    if (existingUserWithPhone) {
      return bot.sendMessage(
        chatId,
        "❗️ Bu telefon raqam allaqachon boshqa foydalanuvchi tomonidan ro'yxatdan o'tkazilgan. Iltimos, boshqa raqam kiriting yoki admin bilan bog'laning."
      );
    }

    const filter = { telegramId: contact.user_id };
    const update = {
      firstName: msg.from.first_name,
      phoneNumber: contact.phone_number,
      photo: await getPhoto(contact.user_id),
      username: msg.from.username,
      isActive: true,
    };
    const options = { new: true };

    const user = await User.findOneAndUpdate(filter, update, options);

    if (!user) {
      return bot.sendMessage(
        chatId,
        "Foydalanuvchi topilmadi. Iltimos, /start buyrug'ini qayta bosing."
      );
    }

    const token = sign({ id: user._id });

    await bot.sendMessage(
      chatId,
      "✅ Telefon raqam qabul qilindi! Endi botdan to'liq foydalanishingiz mumkin.",
      {
        reply_markup: {
          remove_keyboard: true,
        },
      }
    );

    const url = `https://steam-bot-front.vercel.app?token=${token}`;
    // bot.sendMessage(chatId, url);

    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: JSON.stringify({
        type: "web_app",
        text: "Menu",
        web_app: {
          url: url,
        },
      }),
    });
  } catch (err) {
    console.error("Telefon raqamni saqlashda xatolik:", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.phoneNumber) {
      bot.sendMessage(
        chatId,
        "❗️ Kiritilgan telefon raqam allaqachon ro'yxatdan o'tgan."
      );
    } else {
      bot.sendMessage(
        chatId,
        "❌ Telefon raqamni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring."
      );
    }
  }
});
