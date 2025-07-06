import { AddPracticePhase, UserMode, WithdrawGroupPhase } from '../../const/enums';

export type Session = {
	mode?: UserMode;
	phase?: AddPracticePhase | WithdrawGroupPhase;
	data?: SessionData;
};

export class SessionData {
	groupIdTeamId?: string;
	groupName?: string;
	placeId?: string;
	date?: string;
	startTime?: string;
	endTime?: string;
}
