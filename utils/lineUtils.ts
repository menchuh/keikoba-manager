import { PostbackAction, TemplateColumn, TemplateMessage } from '@line/bot-sdk';
import dayjs from 'dayjs';
import { BelongingGroup } from '../src/type/belonging_groups';
import { AddPracticePhase, ConfirmTemplateAction } from '../const/enums';
import { CAROUSEL_COLUMN_MAX } from '../const/commons';
import { Place } from '../src/type/places';
import { SessionData } from '../src/type/session';
import { Context } from 'hono';
import { createPractice } from '../models/practices';
import { ulid } from 'ulid';
import { logger } from './logger';

//---------------------------
// 定数
//---------------------------
const MESSAGE_DATE_FORMAT = 'MM/DD';
const WEEKDAY_ARRAY = ['月', '火', '水', '木', '金', '土', '日'];

//---------------------------
// 関数
//---------------------------
/**
 * エラーのresponse bodyを生成する関数
 * @param statusCode ステータスコード
 * @param message エラーメッセージ
 * @returns Object
 */
export const getErrorBody = (statusCode: number, message: string) => {
	let error = '';

	switch (statusCode) {
		case 400:
			error = 'Bad Request';
			break;
		case 404:
			error = 'Not Found';
			break;
		default:
			error = 'Internal Server Error';
	}

	return { error: error, message: message };
};

/**
 * 日付文字列をLINEメッセージ上で表示する日付フォーマットに変換する関数
 * @param date 日付文字列
 * @returns string
 */
export const getMessageDateFormat = (date: string): string => {
	const dt = dayjs(date);
	return `${dt.format(MESSAGE_DATE_FORMAT)}(${WEEKDAY_ARRAY[dt.day()]})`;
};

/**
 * 座組を抜けるメニューボタン押下時の返信メッセージを生成する関数
 * @param groups グループ[]
 * @returns
 */
export const createWithdrawGroupButtonMessage = (groups: BelongingGroup[]): TemplateMessage => {
	const buttons: PostbackAction[] = [];
	groups.forEach((g) => {
		buttons.push({ type: 'postback', text: g.groupName!, displayText: g.groupName!, data: `group_id=${g.groupIdTeamId}` });
	});
	return {
		type: 'template',
		altText: '座組を抜けるボタン',
		template: {
			type: 'buttons',
			title: '座組を抜ける',
			text: '座組を抜けられるんですね\nどの座組を抜けますか？',
			actions: buttons.map((b: PostbackAction) => {
				return { type: b.type, label: b.displayText!, data: b.data };
			}),
		},
	};
};

/**
 * 座組を抜けるかどうかの確認ボタンメッセージを生成する関数
 * @param groups グループ
 * @returns
 */
export const createWithdrawGroupConfirmMessage = (group: BelongingGroup): TemplateMessage => {
	return {
		type: 'template',
		altText: '座組を抜ける確認',
		template: {
			type: 'confirm',
			text: `「${group.groupName}」から本当に抜けますか？`,
			actions: [
				{ type: 'postback', label: '抜ける', displayText: '抜ける', data: `action=${ConfirmTemplateAction.approve}` },
				{ type: 'postback', label: 'やめておく', displayText: 'やめておく', data: `action=${ConfirmTemplateAction.cancel}` },
			],
		},
	};
};

/**
 * 与えられたカルーセルの個数から、必要な送信メッセージの個数を算出する関数
 * @param count
 * @returns number
 */
export const getPushMessageCount = (carouselCount: number): number => {
	return Math.floor((carouselCount + CAROUSEL_COLUMN_MAX - 1) / CAROUSEL_COLUMN_MAX);
};

/**
 * どの座組に対して稽古予定の追加を行うか尋ねるボタンメッセージを生成する関数
 * @param groups グループ[]
 * @returns TemplateMessage
 */
export const createAddPracticeAskGroupMessage = (groups: BelongingGroup[]): TemplateMessage => {
	const buttons: PostbackAction[] = [];
	groups.forEach((g) => {
		buttons.push({
			type: 'postback',
			displayText: g.groupName!,
			data: `group_id=${g.groupIdTeamId}`,
		});
	});
	return {
		type: 'template',
		altText: '稽古予定追加メッセージ',
		template: {
			type: 'buttons',
			title: '座組を選択',
			text: 'どの座組の稽古を追加しますか？',
			actions: buttons.map((b: PostbackAction) => {
				return { type: b.type, label: b.displayText!, data: b.data };
			}),
		},
	};
};

/**
 * 稽古場選択のカルーセルメッセージを生成する関数
 * @param places 稽古場リスト
 * @param start 開始位置
 * @returns TemplateMessage
 */
export const createAddPracticeAskPlaceMessage = async (places: Place[], start: number): Promise<TemplateMessage> => {
	// カラムの生成
	let columns: TemplateColumn[] = [];
	places.forEach((p) => {
		columns.push({
			thumbnailImageUrl: p.imageUrl || '',
			text: p.name,
			actions: [{ type: 'postback', label: '選ぶ', displayText: p.name, data: `place=${p.placeId}` }],
		});
	});

	return {
		type: 'template',
		altText: '稽古予定追加メッセージ',
		template: { type: 'carousel', columns: columns.slice(start, start + (CAROUSEL_COLUMN_MAX - 1)) },
	};
};

/**
 * 稽古予定作成にて日付を尋ねるメッセージを生成する関数
 * @returns TemplateMessage
 */
export const createAddPracticeAskDateMessage = (): TemplateMessage => {
	return {
		type: 'template',
		altText: '稽古予定を追加',
		template: {
			type: 'buttons',
			title: '稽古予定を追加（2/4）',
			text: '稽古の日付を入力してください',
			actions: [{ type: 'datetimepicker', label: '日付を指定', data: '日付を指定', mode: 'date' }],
		},
	};
};

/**
 * 稽古予定作成にて時間を尋ねるメッセージを生成する関数
 * @param phase 稽古予定追加のフェーズ
 * @returns
 */
export const createAddPracticeAskTimeMessage = (phase: AddPracticePhase): TemplateMessage => {
	const title = phase === AddPracticePhase.AskStart ? '稽古予定を追加（3/4）' : '稽古予定を追加（4/4）';
	const text = phase === AddPracticePhase.AskStart ? '稽古の開始時間を入力してください' : '稽古の終了時間を入力してください';
	return {
		type: 'template',
		altText: '稽古予定を追加',
		template: {
			type: 'buttons',
			title,
			text,
			actions: [{ type: 'datetimepicker', label: '時間を指定', data: '時間を指定', mode: 'time', initial: '13:00' }],
		},
	};
};

/**
 * ボット経由で稽古予定を追加する関数
 * @param data
 * @param endTime
 * @param c
 */
export const createPracticeViaBot = async (data: SessionData, endTime: string, c: Context) => {
	const practiceId = ulid();
	logger.info(data);
	await createPractice(practiceId, data.groupIdTeamId!, data.placeId!, data.date!, data.startTime!, endTime, c);
};
