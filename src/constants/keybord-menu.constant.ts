import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Group } from '../models/group.model';
import { BotActions } from '../models/bot.model';

export const KEYBOARD_MAIN_MENU: InlineKeyboardButton[][] = [
    [
        {
            text: 'Получить список моих групп',
            callback_data: BotActions.GET_ALL_GROUPS,
        },
    ],
    [
        {
            text: 'Добавить группу',
            callback_data: BotActions.ADD_GROUP,
        },
        {
            text: 'Удалить группу',
            callback_data: BotActions.REMOVE_GROUP,
        },
    ],
    [
        {
            text: 'Отписаться от всех групп',
            callback_data: BotActions.REMOVE_ALL_GROUPS,
        }
    ]
];

export const getDeleteGroupMenu = (groupIds: number[], groups: Group[]): InlineKeyboardButton[][] => {
    const groupsMap = groups.reduce((result, group) => {
        result.set(group.id, group);
        return result;
    }, new Map<number, Group>());

    return groupIds.reduce<InlineKeyboardButton[][]>((result, groupId) => {
        const group = groupsMap.get(groupId);
        result.push([{
            text: group!.name,
            callback_data: `id_${group!.id}`,
        }])
        return result;
    }, [])
};
