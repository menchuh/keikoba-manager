import { messagingApi } from '@line/bot-sdk';
import dayjs from 'dayjs';
import { Context } from 'hono';
import { MESSAGE_DATE_FORMAT, TABLE_DATE_FORMAT } from '../../const/commons';
import { listBelongingAccounts } from '../models/account_groups';
import { getGroupIdHasDeinedDatePractice, getPracticeByGroupIdAndDate, setNotifiedPracice } from '../models/practices';
import { logger } from '../../utils/logger';

// 日次で翌日の練習を通知する関数
export const notifyDailyPractice = async (c: Context) => {
	try {
		//---------------------------
		// 環境変数
		//---------------------------
		const accessToken = c.env.CHANNEL_ACCESS_TOKEN as string;

		//---------------------------
		// データを格納するオブジェクトの生成
		//---------------------------
		const data: {
			[key: string]: {
				accounts: string[];
				message?: string;
				practices?: string[];
			};
		} = {};

		//---------------------------
		// APIクライアント生成
		//---------------------------
		const client = new messagingApi.MessagingApiClient({ channelAccessToken: accessToken });

		logger.info('NOTIFY DAILY PRACTICE START');

		//---------------------------
		// 明日の練習があるグループを取得する
		//---------------------------
		const tomorrow = dayjs().add(1, 'day').format(TABLE_DATE_FORMAT);
		const groupTeamIds = (await getGroupIdHasDeinedDatePractice(tomorrow, c))?.map((r) => r.groupTeamId);
		if (!groupTeamIds || groupTeamIds.length === 0) {
			logger.info('No groups have practice.');
			logger.info('FINISH NOTIFY DAILY PRACTICE');
			return c.json({ success: true, data: {} }, 200);
		}

		//---------------------------
		// グループごとにアカウントを取得
		//---------------------------
		for (let g of groupTeamIds) {
			const accounts = await listBelongingAccounts(g, c);
			if (accounts && accounts.length !== 0) {
				data[g] = { accounts: accounts.map((a) => a.accountId) };
			}
		}

		if (Object.keys(data).every((gid) => data[gid].accounts.length === 0)) {
			logger.info('No member to notify practice.');
			logger.info('FINISH NOTIFY DAILY PRACTICE');
			return c.json({ success: true, data: {} }, 200);
		}

		//---------------------------
		// グループごとにメッセージを生成
		//---------------------------
		for (let gid of Object.keys(data)) {
			let message = `明日は以下の練習が予定されています\nがんばりましょう!\n`;
			const practices = await getPracticeByGroupIdAndDate(gid, tomorrow, c);
			if (practices && practices.length !== 0) {
				for (let p of practices) {
					message += `${p.groupName}\n${dayjs(p.date).format(MESSAGE_DATE_FORMAT)} ${p.startTime} ~ ${p.endTime}@${p.placeName}\n`;
				}
			}
			data[gid].message = message;
			data[gid].practices = practices?.map((p) => p.practiceId!);
		}

		//---------------------------
		// メッセージ送信
		//---------------------------
		for (let gid of Object.keys(data)) {
			const { accounts, message } = data[gid];
			for (let account of accounts) {
				await client.pushMessage({ to: account, messages: [{ type: 'text', text: message! }] });
			}
		}

		logger.info('FINISH SEND MESSAGES');

		//---------------------------
		// 練習に通知済みフラグを立てる
		//---------------------------
		const practiceIds = Object.keys(data)
			.map((gid) => data[gid].practices!)
			.flat();
		await setNotifiedPracice(practiceIds, c);

		logger.info('FINISH NOTIFY DAILY PRACTICE');

		return c.json({ success: true, data: {} }, 200);
	} catch (err) {
		console.error(err);
		return c.json({ success: false, error: 'データ取得に失敗しました。ダメですよ' }, 500);
	}
};
