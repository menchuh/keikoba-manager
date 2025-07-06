export enum AddPracticePhase {
	AskGroup = 'AskGroup',
	AskPlace = 'AskPlace',
	AskDate = 'AskDate',
	AskStart = 'AskStart',
	AskEnd = 'AskEnd',
}

export enum ConfirmTemplateAction {
	approve = 'approve',
	cancel = 'cancel',
}

export enum EventTypes {
	Follow = 'follow',
	Unfollow = 'unfollow',
	Message = 'message',
	Postback = 'postback',
}

export enum UserMode {
	JoinGroup = 'JoinGroup',
	ListPractices = 'ListPractices',
	NotifyPractices = 'NotifyPractices',
	AddPractice = 'AddPractice',
	DeletePractice = 'DeletePractice',
	WithdrawGroup = 'WithdrawGroup',
}

export enum WithdrawGroupPhase {
	AskGroup = 'AskGroup',
	Confirm = 'Confirm',
}
