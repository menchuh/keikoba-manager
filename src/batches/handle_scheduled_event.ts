export const handleScheduledEvent = async (event: ScheduledController) => {
	switch (event.cron) {
		case '0 12 * * * ':
			await fetch('/scheduled/daily_notification', { method: 'POST' });
	}
	return null;
};
