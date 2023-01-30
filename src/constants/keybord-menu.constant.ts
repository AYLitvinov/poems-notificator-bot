import {InlineKeyboardButton} from "telegraf/typings/core/types/typegram";
import {Group} from "../models/group.model";

export const KEYBOARD_MAIN_MENU: InlineKeyboardButton[][] = [
    [
        {
            text: 'Получить список моих групп',
            callback_data: 'get_all',
        },
    ],
    [
        {
            text: 'Добавить группу',
            callback_data: 'add',
        },
        {
            text: 'Удалить группу',
            callback_data: 'remove',
        },
    ],
    [
        {
            text: 'Отписаться от всех групп',
            callback_data: 'remove_all'
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
            callback_data: `${group!.id}`,
        }])
        return result;
    }, [])
};
