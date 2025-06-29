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

  const findUser = await User.findOne({ telegramId: msg.from.id });

  if (findUser && findUser.isActive) {
    bot.sendMessage(chatId, `👋 Salom ${name} botga xush kelibsiz!`)

    const token = sign({ id: findUser._id });

    console.log(token)

    await User.findOneAndUpdate({ telegramId: msg.from.id }, { photo: await getPhoto(msg.from.id), username: msg.from.username });

    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: JSON.stringify({
        type: "web_app",
        text: "Mening profilim",
        web_app: {
          url: "https://steam-bot-front.vercel.app/?token=" + token,
        },
      }),
    });
  } else {
    await User.create({ telegramId: msg.from.id, chatId, });

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

  if (!contact.phone_number.startsWith("+998")) {
    return bot.sendMessage(
      chatId,
      "❌ Xavfsizlik maqsadida faqatgina O'zbekiston raqamlarini qabul qilamiz."
    );
  }

  try {
    const filter = { telegramId: contact.user_id };
    const update = {
      telegramId: contact.user_id,
      firstName: msg.from.first_name,
      phoneNumber: contact.phone_number,
      photo: await getPhoto(contact.user_id),
      username: msg.from.username,
      isActive: true
    };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const user = await User.findOneAndUpdate(filter, update, options);

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

    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: JSON.stringify({
        type: "web_app",
        text: "Mening profilim",
        web_app: {
          url: "https://yourdomain.com/telegram-webapp?token=" + token,
        },
      }),
    });
  } catch (err) {
    console.error("Telefon raqamni saqlashda xatolik:", err);
    bot.sendMessage(
      chatId,
      "❌ Telefon raqamni saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring."
    );
  }
});
