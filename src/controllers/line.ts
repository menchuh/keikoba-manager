import { messagingApi, validateSignature, WebhookEvent } from '@line/bot-sdk';
import { Context } from 'hono';
import { CAROUSEL_COLUMN_MAX, JOINABLE_GROUP_COUNT } from '../../const/commons';
import { AddPracticePhase, ConfirmTemplateAction, EventTypes, UserMode, WithdrawGroupPhase } from '../../const/enums';
import { getAccount, createAccount, deleteAccountById, updateSession } from '../models/accounts';
import { getBelongingGroups, joinGroups, withdrawGroup } from '../models/account_groups';
import { getGroupByGroupId, getGroupByGroupIdTeamId } from '../models/groups';
import { getPlaceById, getPlacesByTeamId } from '../models/places';
import { getPracticesByGroup, isSamePracticeItemExists } from '../models/practices';
import { Session } from '../type/session';
import {
	createAddPracticeAskDateMessage,
	createAddPracticeAskGroupMessage,
	createAddPracticeAskPlaceMessage,
	createAddPracticeAskTimeMessage,
	createPracticeViaBot,
	createWithdrawGroupButtonMessage,
	createWithdrawGroupConfirmMessage,
	getErrorBody,
	getMessageDateFormat,
	getPushMessageCount,
} from '../../utils/lineUtils';
import { logger } from '../../utils/logger';
import { isBeforeToday, isTimeABeforeTimeB } from '../../utils/stringUtils';

//---------------------------
// メイン処理
//---------------------------
export const processMessage = async (c: Context) => {
	const data = await c.req.json();
	const headers = c.req.header();
	const events: WebhookEvent[] = (data as any).events;

	//---------------------------
	// 環境変数
	//---------------------------
	const accessToken = c.env.CHANNEL_ACCESS_TOKEN as string;
	const channelSecret = c.env.CHANNEL_SECRET as string;

	//---------------------------
	// シグネチャの検証
	//---------------------------
	const signature = headers['x-line-signature'];
	if (!signature || !validateSignature(JSON.stringify(data), channelSecret, signature)) {
		logger.error('Failed to verify signature.');
		return c.json({
			statusCode: 403,
			body: JSON.stringify(getErrorBody(403, 'Forbidden')),
		});
	}

	if (!data) {
		logger.error('body is empty.');
		return c.json({
			statusCode: 400,
			body: JSON.stringify(getErrorBody(400, '"body" is empty.')),
		});
	}

	//---------------------------
	// Webhook検証イベント
	//---------------------------
	if (headers['user-agent'] === 'LineBotWebhook/2.0' && events.length === 0) {
		logger.info('verify webhook event.');
		return c.json({
			statusCode: 200,
			body: JSON.stringify({ message: 'ok' }),
		});
	}

	//---------------------------
	// APIクライアント生成
	//---------------------------
	const client = new messagingApi.MessagingApiClient({ channelAccessToken: accessToken });

	const lineEvent = events[0];

	//---------------------------
	// アカウント取得
	//---------------------------
	const accountId = lineEvent.source.userId!;
	const account = await getAccount(accountId, c);

	if (account && lineEvent.type === EventTypes.Follow) {
		logger.error('This user is already exist.');
		return c.json({ message: 'ok' });
	}

	if (!account && lineEvent.type !== EventTypes.Follow) {
		logger.error('This user is not exist and this is not follow event.');
		// ユーザーオブジェクト追加
		await createAccount(accountId, c);
		// メッセージ
		const text = `エラーが発生しました。もう一度話しかけてみてください`;
		await client.pushMessage({
			to: accountId,
			messages: [{ type: 'text', text: text }],
		});
		return c.json({ message: 'ok' });
	}

	//---------------------------
	// フォローイベント
	//---------------------------
	if (!account && lineEvent.type === EventTypes.Follow) {
		logger.info('Follow Event');
		// ユーザーオブジェクト追加
		await createAccount(accountId, c);
		// プロフィールの取得
		const profile = await client.getProfile(accountId);
		const { displayName } = profile;
		// メッセージ
		const text = `こんにちは！ 稽古管理Botです\n${displayName}さん、これからよろしくね`;
		await client.replyMessage({
			replyToken: lineEvent.replyToken,
			messages: [{ type: 'text', text: text }],
		});
		return c.json({ message: 'ok' });
	}

	//---------------------------
	// ブロックイベント
	//---------------------------
	if (lineEvent.type === EventTypes.Unfollow) {
		logger.info('Unfollow Event (This account is blocked.)');
		await deleteAccountById(accountId, c);
		return c.json({ message: 'ok' });
	}

	const session: Session = JSON.parse(account?.session || '{}');
	const belongingGroups = (await getBelongingGroups(accountId, c)) || [];

	//---------------------------
	// テキストメッセージ
	//---------------------------
	if (lineEvent.type === EventTypes.Message && lineEvent.message.type === 'text') {
		logger.info('Text Message Event');
		//-------------------
		// 座組参加
		//-------------------
		if (session && session.mode === UserMode.JoinGroup) {
			let text = '';

			const groupId = lineEvent.message.text;
			const group = await getGroupByGroupId(groupId, c);

			if (!group) {
				text += '指定された座組は存在しません';
			} else if (belongingGroups.map((g) => g.groupId).includes(groupId)) {
				text += 'その座組にはすでに参加しています';
			} else {
				// 座組の設定
				await joinGroups(group.groupIdTeamId!, accountId, c);
				// セッション情報のクリア
				await updateSession({}, accountId, c);
				text = `「${group.groupName}」に参加しました`;
			}

			// メッセージ送信
			await client.replyMessage({
				replyToken: lineEvent.replyToken,
				messages: [{ type: 'text', text: text }],
			});
		} else {
			//-------------------
			// その他のテキストメッセージ
			//-------------------
			logger.info('Text messages not group participation.');
			// 座組に参加していないユーザー
			if (belongingGroups.length === 0) {
				// メッセージ送信
				const text = '座組に未参加です。\nメニューの「座組に参加」ボタンをタップして、座組に参加してください';
				await client.replyMessage({
					replyToken: lineEvent.replyToken,
					messages: [{ type: 'text', text: text }],
				});
				// 座組に参加しているユーザー
			} else {
				// メッセージ送信
				const text = 'ごめんなさい！\nこのアカウントではメッセージにお答えできません >_<';
				await client.replyMessage({
					replyToken: lineEvent.replyToken,
					messages: [{ type: 'text', text: text }],
				});
			}
		}
	}

	//---------------------------
	// ボタン押下
	//---------------------------
	if (lineEvent.type === EventTypes.Postback) {
		logger.info('Postback Event');

		//---------------------------
		// メニューボタン押下
		//---------------------------
		if (lineEvent.postback.data.includes('method=')) {
			const method = lineEvent.postback.data.replace('method=', '');
			logger.info(method);

			//---------------------------
			// 座組に参加
			//---------------------------
			if (method === UserMode.JoinGroup) {
				if (belongingGroups.length > JOINABLE_GROUP_COUNT) {
					// 参加最大可能座組数を超える場合
					const text = `参加できる座組は${JOINABLE_GROUP_COUNT}組までです。\n「座組を抜ける」ボタンから座組を抜けたのち、もう一度お試しください`;
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else {
					// 正常ケース
					const session: Session = {
						mode: UserMode.JoinGroup,
					};
					await updateSession(session, accountId, c);
					// メッセージ送信
					const text = '座組に参加されるんですね！\n座組のIDを入力してください';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				}
			}

			//---------------------------
			// 稽古予定の確認
			//---------------------------
			if (method === UserMode.ListPractices) {
				if (belongingGroups.length === 0) {
					// 参加している座組がない場合
					const text = '参加している座組がありません';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else {
					// 座組に参加している場合
					const groupIdTeamIds = belongingGroups.map((g) => g.groupIdTeamId);
					let practiceGroupItems = [];
					// 稽古予定の取得
					for (let groupIdTeamId of groupIdTeamIds) {
						practiceGroupItems.push(await getPracticesByGroup(groupIdTeamId!, true, c));
					}
					const practiceGroups = practiceGroupItems.filter((p) => p!.length !== 0);

					if (practiceGroups.length === 0) {
						// 予定されている稽古がない場合
						const text = '予定されている稽古はありません';
						await client.replyMessage({
							replyToken: lineEvent.replyToken,
							messages: [{ type: 'text', text: text }],
						});
					} else {
						// 予定されている稽古がある場合
						let practices_text = '';
						practiceGroups.forEach((x, i, self) => {
							practices_text += `【${x![0].groupName}】\n`;
							x!.forEach((y) => {
								practices_text += `${getMessageDateFormat(y.date!)} ${y.startTime}〜${y.endTime}@${y.placeName}\n`;
							});
							if (i + 1 < self.length) {
								practices_text += '\n';
							}
						});
						const text = `予定されている稽古は以下の通りです。\n\n${practices_text}`;
						await client.replyMessage({
							replyToken: lineEvent.replyToken,
							messages: [{ type: 'text', text: text }],
						});
					}
				}
				await updateSession({}, accountId, c);
			}

			//---------------------------
			//　稽古予定を追加
			//---------------------------
			//Todo: Placeが0件の時の対応
			if (method === UserMode.AddPractice) {
				if (belongingGroups.length === 0) {
					// 参加している座組がない場合
					// メッセージ送信
					const text = '参加している座組がありません';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else if (belongingGroups.length === 1) {
					const updatedSession = {
						mode: UserMode.AddPractice,
						phase: AddPracticePhase.AskPlace,
						data: { groupIdTeamId: belongingGroups[0].groupIdTeamId!, groupName: belongingGroups[0].groupName! },
					};
					await updateSession(updatedSession, accountId, c);
					const places = await getPlacesByTeamId(belongingGroups[0].teamId!, c);
					const carouselMessageCount = getPushMessageCount(places!.length);
					let carouselMessages = [];
					for (let i = 0; i < carouselMessageCount; i++) {
						if (i === 0) {
							carouselMessages.push(await createAddPracticeAskPlaceMessage(places!, i));
						} else {
							carouselMessages.push(await createAddPracticeAskPlaceMessage(places!, CAROUSEL_COLUMN_MAX * i - 1));
						}
					}
					const text = '稽古予定を追加（1/4）\n稽古場所を指定してください';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }, ...carouselMessages],
					});
				} else {
					// 複数の座組に参加している場合
					const session: Session = {
						mode: UserMode.AddPractice,
						phase: AddPracticePhase.AskGroup,
					};
					await updateSession(session, accountId, c);
					// メッセージ送信
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [createAddPracticeAskGroupMessage(belongingGroups)],
					});
				}
			}

			//---------------------------
			// 座組を抜ける
			//---------------------------
			if (method === UserMode.WithdrawGroup) {
				if (belongingGroups.length === 0) {
					// 参加している座組がない場合
					const text = '参加している座組がありません';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else {
					// 参加している座組がある場合
					const session: Session = {
						mode: UserMode.WithdrawGroup,
						phase: WithdrawGroupPhase.AskGroup,
					};
					await updateSession(session, accountId, c);
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [createWithdrawGroupButtonMessage(belongingGroups)],
					});
				}
			}
		}

		//---------------------------
		// メッセージボタン押下
		//---------------------------

		//---------------------------
		// 稽古予定を追加モード
		//---------------------------
		if (session?.mode === UserMode.AddPractice) {
			logger.info(UserMode.AddPractice);
			logger.info(session.phase);
			//---------------------------
			// 座組の指定
			//---------------------------
			if (session.phase === AddPracticePhase.AskGroup) {
				const groupIdTeamId = lineEvent.postback.data.replace('group_id=', '');
				const group = belongingGroups.find((g) => g.groupIdTeamId === groupIdTeamId);
				const updatedSession: Session = {
					mode: UserMode.AddPractice,
					phase: AddPracticePhase.AskPlace,
					data: {
						groupIdTeamId: group?.groupIdTeamId!,
						groupName: group?.groupName!,
					},
				};
				await updateSession(updatedSession, accountId, c);
				const places = await getPlacesByTeamId(group!.teamId!, c);
				const carouselMessageCount = getPushMessageCount(places!.length);
				let carouselMessages = [];
				for (let i = 0; i < carouselMessageCount; i++) {
					if (i === 0) {
						carouselMessages.push(await createAddPracticeAskPlaceMessage(places!, i));
					} else {
						carouselMessages.push(await createAddPracticeAskPlaceMessage(places!, CAROUSEL_COLUMN_MAX * i - 1));
					}
				}
				const text = '稽古予定を追加（1/4）\n稽古場所を指定してください';
				await client.replyMessage({
					replyToken: lineEvent.replyToken,
					messages: [{ type: 'text', text: text }, ...carouselMessages],
				});
			}

			//---------------------------
			// 場所の指定
			//---------------------------
			if (session.phase === AddPracticePhase.AskPlace) {
				const placeId = lineEvent.postback.data.replace('place=', '');
				const group = await getGroupByGroupIdTeamId(session.data?.groupIdTeamId!, c);
				const updatedSession: Session = {
					mode: UserMode.AddPractice,
					phase: AddPracticePhase.AskDate,
					data: {
						groupIdTeamId: group?.groupIdTeamId,
						groupName: group?.name,
						placeId: placeId,
					},
				};
				await updateSession(updatedSession, accountId, c);
				await client.replyMessage({
					replyToken: lineEvent.replyToken,
					messages: [createAddPracticeAskDateMessage()],
				});
			}

			//---------------------------
			// 日付の指定
			//---------------------------
			if (session.phase === AddPracticePhase.AskDate) {
				const params = lineEvent.postback.params as any;
				const date: string = params.date;
				if (isBeforeToday(date)) {
					// 日付が今日より前の場合
					const text = '【エラー】\n日付には今日以降の日付を指定してください';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else {
					// 日付が今日以降の場合
					const updatedSession: Session = {
						mode: UserMode.AddPractice,
						phase: AddPracticePhase.AskStart,
						data: {
							...session.data,
							date: date,
						},
					};
					await updateSession(updatedSession, accountId, c);
					// メッセージ送信
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [createAddPracticeAskTimeMessage(AddPracticePhase.AskStart)],
					});
				}
			}

			//---------------------------
			// 開始時間の指定
			//---------------------------
			if (session.phase === AddPracticePhase.AskStart) {
				const params = lineEvent.postback.params as any;
				const startTime: string = params.time!;
				if (await isSamePracticeItemExists(session.data?.groupIdTeamId!, session.data?.placeId!, session.data?.date!, startTime, c)) {
					await updateSession({}, accountId, c);
					// メッセージ送信
					const text =
						'一つの座組の稽古予定に、同じ稽古場で同じ日付、同じ開始時間の稽古は二つ以上登録できません。\n初めからやりなおしてください';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else {
					const updatedSession: Session = {
						mode: UserMode.AddPractice,
						phase: AddPracticePhase.AskEnd,
						data: {
							...session.data,
							startTime: startTime,
						},
					};
					await updateSession(updatedSession, accountId, c);
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [createAddPracticeAskTimeMessage(AddPracticePhase.AskEnd)],
					});
				}
			}

			//---------------------------
			// 終了時間の指定
			//---------------------------
			if (session.phase === AddPracticePhase.AskEnd) {
				const params = lineEvent.postback.params as any;
				const endTime: string = params.time!;
				if (!isTimeABeforeTimeB(session.data?.startTime!, endTime)) {
					// 終了時間が開始時間より前の場合
					const text = '【エラー】\n終了時間には、開始時間より後の時間を指定してください';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else {
					// 正常系
					const { data } = session;
					const place = await getPlaceById(data!.placeId!, c);
					const practiceInfo = `[座組]\n${data!.groupName}\n[場所]\n${place!.name}\n[日付]\n${data!.date}\n[時間]\n${
						data!.startTime
					}~${endTime}`;
					// 稽古の登録
					await createPracticeViaBot(session.data!, endTime, c);
					await updateSession({}, accountId, c);
					const text = `以下の内容で登録しました。\n${practiceInfo}`;
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				}
			}
		}

		//---------------------------
		// 座組を抜けるモード
		//---------------------------
		if (session?.mode === UserMode.WithdrawGroup) {
			logger.info(UserMode.WithdrawGroup);
			if (session.phase === WithdrawGroupPhase.AskGroup) {
				// 本当に抜けるかどうかの確認
				const groupIdTeamId = lineEvent.postback.data.replace('group_id=', '');
				const group = belongingGroups.find((g) => g.groupIdTeamId === groupIdTeamId);
				const session: Session = {
					mode: UserMode.WithdrawGroup,
					phase: WithdrawGroupPhase.Confirm,
					data: {
						groupIdTeamId: groupIdTeamId,
						groupName: group?.groupName!,
					},
				};
				await updateSession(session, accountId, c);
				await client.replyMessage({
					replyToken: lineEvent.replyToken,
					messages: [createWithdrawGroupConfirmMessage(group!)],
				});
			} else if (session.phase === WithdrawGroupPhase.Confirm) {
				// 座組を抜ける処理
				const action = lineEvent.postback.data.replace('action=', '');
				if (action === ConfirmTemplateAction.approve) {
					// 座組を抜ける場合
					const groupToWithdraw = session.data;
					const groupIdTeamId = groupToWithdraw?.groupIdTeamId;
					await withdrawGroup(groupIdTeamId!, accountId, c);
					await updateSession({}, accountId, c);
					const text = `「${groupToWithdraw?.groupName}」を抜けました。お疲れさまでした`;
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				} else if (action === ConfirmTemplateAction.cancel) {
					// 座組を抜けない
					await updateSession({}, accountId, c);
					const text = '座組にはそのまま参加されるんですね。\nかしこまりました';
					await client.replyMessage({
						replyToken: lineEvent.replyToken,
						messages: [{ type: 'text', text: text }],
					});
				}
			}
		}
	}

	return c.json({ message: 'ok' });
};
