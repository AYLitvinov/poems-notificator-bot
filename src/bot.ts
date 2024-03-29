import { Context, Telegraf } from 'telegraf';
import { Update } from 'typegram';
import { getDeleteGroupMenu, KEYBOARD_MAIN_MENU } from './constants/keybord-menu.constant';
import { VkApiService } from './services/vk-api.service';
import { DbService } from './services/db.service';
import { BotActions } from './models/bot.model';
import { CronService } from './services/cron.service';
import { SubscriptionService } from './services/subscription.service';

const bot: Telegraf<Context<Update>> = new Telegraf(process.env.BOT_TOKEN as string);
const vkApiService = new VkApiService();
const dbService = new DbService();
const cronService = new CronService();
const subscriptionService = new SubscriptionService(dbService, cronService, vkApiService);

subscriptionService.getUpdateEvent()
    .subscribe(event => {
        event.chatIds.forEach(chatId => {
            event.wallItems.forEach(wallItem => {
                if (wallItem.text) {
                    bot.telegram.sendMessage(chatId, `Новая запись от ${event.groupName}:\n\n${wallItem.text}`);
                }
            })
            console.log(`New wall items sended to chat with id: ${chatId}`);
        })
    })

bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const chat = await dbService.getChatById(chatId);

    if (!chat) {
        const isNewChatAdded = await dbService.addNewChat(chatId, []);

        if (isNewChatAdded) {
            console.log(`New chat added with id: ${chatId}`);
        }
    }

    ctx.reply('Привет!', {
            reply_markup: {
                inline_keyboard: KEYBOARD_MAIN_MENU,
            },
        }
    );
});

bot.help(async (ctx) => {
    ctx.reply('Меню:', {
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
        const groupInfo = ((await vkApiService.getGroupInfo(groupId)) || []).shift(); // always first element
        const chat = await dbService.getChatById(chatId);

        let isChatUpdated = false;
        let isGroupAdded = false;

        if (groupInfo) {
            if (!chat!.groupIds.includes(groupInfo.id)) {
                isChatUpdated = await dbService.updateChat(chatId, [...chat!.groupIds, groupInfo.id]);

                if (isChatUpdated) {
                    console.log(`Group with id: ${groupInfo.id} added to chat with id: ${chatId}`);
                }
            }

            const isGroupAlreadyAdded = !!await dbService.getGroupById(groupInfo.id);
            isGroupAdded = isGroupAlreadyAdded ?
                false : await dbService.addNewGroup({
                    id: groupInfo.id,
                    name: groupInfo.name,
                    domainName: groupInfo.screen_name,
                    wallItems: []
                });

            if (isGroupAdded) {
                subscriptionService.addNewGroup(groupInfo.id, groupInfo.name);
                console.log(`Group with id: ${groupInfo.id} added`);
            }
        }


        if (isChatUpdated) {
            ctx.reply(`Группа добавлена.`);
        }
    }
})

bot.action(BotActions.GET_ALL_GROUPS, async (ctx) => {
    const chatId = (await ctx.getChat()).id;
    const groups = await dbService.getGroupsByChatId(chatId);

    ctx.answerCbQuery()
        .then(() => {
            ctx.sendMessage((groups || []).length > 0 ?
                `Список твоих групп: \n${groups ? groups.map(group => group.name).join('\n') : ''}` : `Нет добавленных групп.`);
        });
});

bot.action(BotActions.ADD_GROUP, (ctx) => {
    ctx.answerCbQuery()
        .then(() => {
            ctx.reply('Чтобы добавить группу откуда ты хочешь получать записи, пришли мне на нее ссылку. Прим.: https://vk.com/example_group_name');
        });
});

bot.action(BotActions.REMOVE_GROUP, async (ctx) => {
    const chatId = (await ctx.getChat()).id;
    const groupIds = (await dbService.getChatById(chatId))?.groupIds;
    const groups = (await dbService.getGroups()) || [];

    ctx.answerCbQuery()
        .then(() => {
            if (groups.length > 0) {
                ctx.sendMessage('Выбери группу, которую ты хочешь удалить:', {
                        reply_markup: {
                            inline_keyboard: getDeleteGroupMenu(groupIds || [], groups),
                        },
                    }
                );
            } else {
                ctx.sendMessage('Нет добавленных групп.')
            }
        });
});

bot.action(new RegExp(/^id_\d*/), async (ctx) => {
    const chatId = (await ctx.getChat()).id;
    const groupId = Number((ctx.update.callback_query as any).data.replace('id_', ''));

    const chat = await dbService.getChatById(chatId);
    const isGroupIdRemovedFromChat = chat ?
        await dbService.updateChat(chatId, chat.groupIds.filter(id => id !== groupId)) : false;

    ctx.answerCbQuery()
        .then(() => {
            if (isGroupIdRemovedFromChat) {
                ctx.reply('Группа удалена.')
                console.log(`Group with id: ${groupId} was removed from the chat with id: ${chatId}`);
            } else {
                ctx.reply('Не удалось удалить группу.')
            }
        });

    const chats = await dbService.getChats();
    const isGroupIdExistsInOtherChat = chats.some(chat => chat.groupIds.includes(groupId));

    if (!isGroupIdExistsInOtherChat) {
        dbService.removeGroup(groupId).then(() => {
            subscriptionService.removeGroup(groupId);
            console.log(`Group with id: ${groupId} has been removed`);
        });
    }
});

bot.action(BotActions.REMOVE_ALL_GROUPS, async (ctx) => {
    const chatId = (await ctx.getChat()).id;
    const chat = await dbService.getChatById(chatId);

    if ((chat?.groupIds || []).length > 0) {
        const isChatUpdated = await dbService.updateChat(chatId, []);

        const chats = await dbService.getChats();

        const existsGroupIds = chats.reduce((result, chat) => {
            chat.groupIds.forEach(groupId => {
                result.add(groupId);
            })
            return result;
        }, new Set<number>());

        (chat?.groupIds || [])
            .forEach(removedGroupId => { // group id from removed chat
                if (!existsGroupIds.has(removedGroupId)) {
                    dbService.removeGroup(removedGroupId)
                        .then(() => {
                            subscriptionService.removeGroup(removedGroupId);
                            console.log(`Removed group with id: ${removedGroupId}`);
                        });
                }
            })

        if (isChatUpdated) {
            ctx.answerCbQuery()
                .then(() => {
                    ctx.reply('Вы отписались от всех групп.');
                    console.log(`All groups removed from chat with id: ${chatId}`);
                });
        }
    } else {
        ctx.answerCbQuery()
            .then(() => {
                ctx.reply('Нет добавленных групп.');
            })
    }
});

bot.catch(err => {
    console.log(err);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
