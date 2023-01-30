import {Context, Telegraf} from 'telegraf';
import {Update} from 'typegram';
import {getDeleteGroupMenu, KEYBOARD_MAIN_MENU} from './constants/keybord-menu.constant';
import {VkApiService} from './services/vk-api.service';
import {DbService} from './services/db.service';

const bot: Telegraf<Context<Update>> = new Telegraf(process.env.BOT_TOKEN as string);
const vkApiService = new VkApiService();
const dbService = new DbService();

bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const chat = await dbService.getChatById(chatId);
    if (!chat) {
        dbService.addNewChat(chatId, [])
            .then(() => {
                console.log(`Добавлен чат с id: ${chatId}`)
            });
    }

    ctx.reply('Привет!', {
            reply_markup: {
                inline_keyboard: KEYBOARD_MAIN_MENU,
            },
        }
    );
});

bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const link = ctx.message.text.trim();
    const pattern = new RegExp('https:\\/\\/vk.com');
    if (link.match(pattern)) {
        const groupId = link.split('/').pop() || '';
        const groupInfo = ((await vkApiService.getGroupInfo(groupId)) || []).shift(); // всегда будет первый элемент
        const chat = await dbService.getChatById(chatId);

        let isChatUpdated = false;
        let isGroupAdded = false;

        if (groupInfo) {
            if (!chat!.groupIds.includes(groupInfo.id)) {
                isChatUpdated = await dbService.updateChat(chatId, [...chat!.groupIds, groupInfo.id]);
            }

            const isGroupAlreadyAdded = !!await dbService.getGroupById(groupInfo.id);
            isGroupAdded = isGroupAlreadyAdded ?
                false : await dbService.addNewGroup({
                    id: groupInfo.id,
                    name: groupInfo.name,
                    domainName: groupInfo.screen_name,
                    wallItems: []
                });
        }


        if (isChatUpdated && isGroupAdded) {
            ctx.reply(`Группа добавлена: ${link}`);
        }
    }
})

bot.action('get_all', (ctx) => {
    console.log('группы');
});

bot.action('add', (ctx) => {
    ctx.answerCbQuery()
        .then(() => {
            ctx.reply('Чтобы добавить группу откуда ты хочешь получать записи, пришли мне на нее ссылку. Прим.: https://vk.com/example_group_name');
    });
});

bot.action('remove', async (ctx) => {
    const chatId = (await ctx.getChat()).id;
    const groupIds = (await dbService.getChatById(chatId))?.groupIds;
    const groups = (await dbService.getGroups()) || [];

    ctx.answerCbQuery()
        .then(() => {
            ctx.sendMessage('Выбери группу, которую ты хочешь удалить:', {
                    reply_markup: {
                        inline_keyboard: getDeleteGroupMenu(groupIds || [], groups),
                    },
                }
            );
        });
});

bot.action(new RegExp('/\\d/gi'), async (ctx) => {
    ctx.answerCbQuery()
        .then(() => {
            console.log(ctx);
        })
});

bot.action('remove_all', (ctx) => {
    console.log('удаляю все');
});

bot.launch().then(() => {
    console.log(`Bot launched:${new Date().toUTCString()}`)
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
