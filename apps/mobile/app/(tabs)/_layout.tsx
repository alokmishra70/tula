import { useEffect } from 'react';
import { LogSheet, useLogFlow } from '@/features/meals';
import { syncNotifications, useReminderPrefs } from '@/features/notifications';
import { useToday } from '@/features/today';
import { localIsoDate } from '@/lib/dates';
import { TabShell } from '@/navigation/TabShell';

export default function TabsLayout() {
  const openLog = useLogFlow((state) => state.openLog);
  const today = useToday(localIsoDate());
  const prefs = useReminderPrefs();

  // Reminders depend on what's logged, so they are re-planned whenever today changes.
  useEffect(() => {
    if (today.data) void syncNotifications(today.data, prefs);
  }, [today.data, prefs]);

  return (
    <>
      <TabShell onLogPress={() => openLog()} />
      <LogSheet />
    </>
  );
}
