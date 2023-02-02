import axios from 'axios';
import {
    VkApiGroupInfo,
    VkApiError,
    VkApiGroupInfoResponse, VkApiGroupWallItems, VkApiGroupWallItemsResponse
} from '../models/vk.model';

const VK_DOMAIN = 'https://api.vk.com/';
const API_VERSION = '5.131';

export class VkApiService {
    getGroupInfo(groupId: string): Promise<VkApiGroupInfoResponse[] | null> {
        return axios.post<VkApiGroupInfo | VkApiError>(`${VK_DOMAIN}method/groups.getById`, {}, {
            params: {
                group_id: groupId,
                access_token: process.env.VK_API_TOKEN as string,
                v: API_VERSION,
            }
        })
            .then(response => {
                if (!this.isError(response.data)) {
                    return (<VkApiGroupInfo>response.data).response;
                } else {
                    console.log(`Ошибка при получении данных о группе: ${(<VkApiError>response.data).error}`);
                    return null;
                }
            })
            .catch(reason => {
                console.log(reason);
                return null;
            })
    }

    getWallItemsById(groupId: string): Promise<VkApiGroupWallItemsResponse | null> {
        return axios.post<VkApiGroupWallItems | VkApiError>(`${VK_DOMAIN}method/wall.get`, {}, {
            params: {
                owner_id: `-${groupId}`,
                access_token: process.env.VK_API_TOKEN as string,
                v: API_VERSION,
                count: 10,
            }
        })
            .then(response => {
                if (!this.isError(response.data)) {
                    return (<VkApiGroupWallItems>response.data).response;
                } else {
                    console.log(`Ошибка при получении записей группы: ${(<VkApiError>response.data).error}`);
                    return null;
                }
            })
            .catch(reason => {
                console.log(reason);
                return null;
            })
    }

    private isError(response: VkApiGroupInfo | VkApiGroupWallItems | VkApiError) {
        return response.hasOwnProperty('error');
    }
}
