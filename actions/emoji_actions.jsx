// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import * as EmojiActions from 'mattermost-redux/actions/emojis';
import {getProfilesByIds} from 'mattermost-redux/actions/users';

import {getEmojiMap} from 'selectors/emojis';

import AppDispatcher from 'dispatcher/app_dispatcher.jsx';
import store from 'stores/redux_store.jsx';
import UserStore from 'stores/user_store.jsx';
import EmojiStore from 'stores/emoji_store.jsx';

import {ActionTypes} from 'utils/constants.jsx';

export async function loadEmoji(getProfiles = true) {
    const {data} = await EmojiActions.getAllCustomEmojis()(store.dispatch, store.getState);

    if (data && getProfiles) {
        loadProfilesForEmoji(data);
    }
}

function loadProfilesForEmoji(emojiList) {
    const profilesToLoad = {};
    for (let i = 0; i < emojiList.length; i++) {
        const emoji = emojiList[i];
        if (!UserStore.hasProfile(emoji.creator_id)) {
            profilesToLoad[emoji.creator_id] = true;
        }
    }

    const list = Object.keys(profilesToLoad);
    if (list.length === 0) {
        return;
    }

    getProfilesByIds(list)(store.dispatch, store.getState);
}

export async function addEmoji(emoji, image, success, error) {
    const {data, error: err} = await EmojiActions.createCustomEmoji(emoji, image)(store.dispatch, store.getState);
    if (data && success) {
        success(data);
    } else if (err && error) {
        error({id: err.server_error_id, ...err});
    }
}

export async function deleteEmoji(emojiId, success, error) {
    const {data, error: err} = await EmojiActions.deleteCustomEmoji(emojiId)(store.dispatch, store.getState);
    if (data) {
        // Needed to remove recently used emoji
        AppDispatcher.handleServerAction({
            type: ActionTypes.REMOVED_CUSTOM_EMOJI,
            id: emojiId
        });

        if (success) {
            success(data);
        }
    } else if (err && error) {
        error({id: err.server_error_id, ...err});
    }
}

export function loadRecentlyUsedCustomEmojis() {
    return async (dispatch, getState) => {
        if (getState().entities.general.config.EnableCustomEmoji !== 'true') {
            return {data: true};
        }

        const recentEmojis = EmojiStore.getRecentEmojis();
        const emojiMap = getEmojiMap(getState());
        const missingEmojis = recentEmojis.filter((name) => !emojiMap.has(name));

        missingEmojis.forEach((name) => {
            EmojiActions.getCustomEmojiByName(name)(dispatch, getState);
        });

        return {data: true};
    };
}

export function incrementEmojiPickerPage() {
    return async (dispatch) => {
        dispatch({
            type: ActionTypes.INCREMENT_EMOJI_PICKER_PAGE
        });

        return {data: true};
    };
}
