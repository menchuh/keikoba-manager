import dayjs from 'dayjs';

export const generateGroupId = (length: number): string => {
	if (!Number.isInteger(length) || length < 1) {
		throw new Error(`文字の長さが不正です。 ${length}`);
	}
	return Math.random()
		.toString(36)
		.slice(-1 * length);
};

/**
 * 与えられた日付が今日より前の日付かどうか判定する関数
 * @param date 日付
 * @returns
 */
export const isBeforeToday = (date: string): boolean => {
	return dayjs(date).isBefore(dayjs());
};

/**
 * 与えられた時刻Aが時刻Bより前かどうか判定する関数
 * @param timeA 時刻A
 * @param timeB 時刻N
 * @returns
 */
export const isTimeABeforeTimeB = (timeA: string, timeB: string): boolean => {
	const timeReExp = new RegExp(/(\d{2}):(\d{2})/);
	const timeAMatches = timeReExp.exec(timeA);
	const timeBMatches = timeReExp.exec(timeB);

	if (!Array.isArray(timeAMatches) || !Array.isArray(timeBMatches)) {
		throw new Error();
	}

	const timeADateTime = dayjs().set('hour', Number(timeAMatches[1])).set('minute', Number(timeAMatches[2]));
	const timeBDateTime = dayjs().set('hour', Number(timeBMatches[1])).set('minute', Number(timeBMatches[2]));
	return timeADateTime.isBefore(timeBDateTime);
};
