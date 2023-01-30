export interface VkApiBaseResponse<T> {
    readonly response: T;
}

export interface VkApiBaseError<T> {
    readonly error: T;
}

export type VkApiGroupInfo = VkApiBaseResponse<VkApiGroupInfoResponse[]>;

export type VkApiError = VkApiBaseError<VkApiErrorResponse>;

export type VkApiGroupWallItems = VkApiBaseResponse<VkApiGroupWallItemsResponse>;

export interface VkApiGroupWallItemsResponse {
    readonly count: number;
    readonly items: VkApiGroupWallItem[];
}

export interface VkApiGroupWallItem {
    readonly id: number;
    readonly text: string;
}

export interface VkApiGroupInfoResponse {
    readonly id: number;
    readonly name: string;
    readonly screen_name: string;
}

export interface VkApiErrorResponse {
    readonly error_code: number;
    readonly error_msg: string;
}
