import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import { KEYBOARD_MENU } from './constants/keybord-menu.constant';

const bot: Telegraf<Context<Update>> = new Telegraf('1527662877:AAEkLGKn7R88mstxNAtud8jExhAdyZW5PBU');

bot.start((ctx) => {
    // ctx.reply('Привет! Пришли мне ссылку на группу VK откуда ты хочешь получать записи. Прим.: https://vk.com/example_group_name');
    ctx.reply('Привет!', {
            reply_markup: {
                inline_keyboard: KEYBOARD_MENU,
            },
        }
    );
});

bot.on('text', (ctx) => {
    const link = ctx.message.text.trim();
    const pattern = new RegExp('https:\\/\\/vk.com');
    if (link.match(pattern)) {
        ctx.reply(`Группа добавлена: ${link}`);
    }
})

bot.action('get_all', (ctx) => {
    console.log('группы');
});

bot.action('add', (ctx) => {
    ctx.reply('Чтобы добавить группу откуда ты хочешь получать записи, пришли мне на нее ссылку. Прим.: https://vk.com/example_group_name');
});

bot.action('remove', (ctx) => {
    console.log('удаляю');
});

bot.action('remove_all', (ctx) => {
    console.log('удаляю все');
});

bot.launch().then(() => {
    console.log(`Bot launched:${new Date().toUTCString()}`)
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
