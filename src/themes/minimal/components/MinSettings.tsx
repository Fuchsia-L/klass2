import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SyncSchedulerStatus } from '../../../features/rating';
import { getConfiguredSyncScheduler, saveSyncToken } from '../../../features/rating';
import { useThemeSettings } from '../../../theme/ThemeContext';
import { loadSettings, saveSemesterSettings } from '../../../features/settings/services/settings.service';
import { exportLocalRatingsAsJson } from '../../../features/settings/services/rating-export.service';
import {
  WhutCourseTableResponseRaw,
  extractArrangedScheduleItems,
  importWhutArrangedList,
} from '../../../features/schedule';
import { WhutImportModal, WhutImportStatus } from '../../../features/schedule/import/WhutImportModal';
import type { MinimalPaletteColors, PaletteChoice } from './minimalTypes';
import { MinPaletteCell } from './parts/MinPaletteCell';
import { MinSettingsBlock } from './parts/MinSettingsBlock';
import { MinSheetBtn } from './parts/MinSheetBtn';
import { MinSheetRow } from './parts/MinSheetRow';

type Props = {
  p: MinimalPaletteColors;
  paletteId: string;
  palettes: PaletteChoice[];
};

const RELATIVE_TIME_REFRESH_MS = 30_000;

function formatRelativeSyncTime(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '未知';
  const seconds = Math.floor(Math.max(0, now - then) / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function describeSyncStatus(status: SyncSchedulerStatus, now: number): string {
  if (status.kind === 'unconfigured') return '未配置云端同步';
  if (status.kind === 'syncing') return '同步中...';
  if (status.kind === 'error') return status.message;
  return status.lastSyncAt ? `同步于 ${formatRelativeSyncTime(status.lastSyncAt, now)}` : '尚未同步';
}

export function MinSettings({ p, paletteId, palettes }: Props) {
  const { setThemeName } = useThemeSettings();
  const [form, setForm] = React.useState({ semesterStart: '', totalWeeks: '' });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [semesterEditing, setSemesterEditing] = React.useState(false);
  const [syncTokenInput, setSyncTokenInput] = React.useState('');
  const [isSavingToken, setIsSavingToken] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<SyncSchedulerStatus>(() => getConfiguredSyncScheduler().getStatus());
  const [relativeTimeTick, setRelativeTimeTick] = React.useState(() => Date.now());
  const [isImportModalVisible, setImportModalVisible] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<WhutImportStatus>('idle');
  const [importErrorMessage, setImportErrorMessage] = React.useState('');
  const [importedCount, setImportedCount] = React.useState<number | undefined>(undefined);
  const [importedTermCode, setImportedTermCode] = React.useState<string | undefined>(undefined);
  const [hasStartedImport, setHasStartedImport] = React.useState(false);
  const importGenerationRef = React.useRef(0);

  React.useEffect(() => {
    let active = true;
    loadSettings().then((settings) => {
      if (!active) return;
      setForm({
        semesterStart: settings.semester?.start_date?.slice(0, 10) ?? '',
        totalWeeks: settings.semester ? String(settings.semester.total_weeks) : '',
      });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field: 'semesterStart' | 'totalWeeks', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  React.useEffect(() => {
    const scheduler = getConfiguredSyncScheduler();
    setSyncStatus(scheduler.getStatus());
    return scheduler.onStatusChange(setSyncStatus);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => setRelativeTimeTick(Date.now()), RELATIVE_TIME_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const currentWeek = React.useMemo(() => {
    if (!form.semesterStart) return '-';
    const start = new Date(form.semesterStart);
    if (Number.isNaN(start.getTime())) return '-';
    return String(Math.floor((Date.now() - start.getTime()) / (7 * 86400000)) + 1);
  }, [form.semesterStart]);

  const handleSaveSemester = async () => {
    const trimmedStart = form.semesterStart.trim();
    const totalWeeks = Number(form.totalWeeks.trim());
    if (!trimmedStart || Number.isNaN(new Date(trimmedStart).getTime())) {
      setMessage('学期开始日期格式应为 YYYY-MM-DD');
      return;
    }
    if (!Number.isInteger(totalWeeks) || totalWeeks <= 0 || totalWeeks > 30) {
      setMessage('总周数需为 1 到 30 的整数');
      return;
    }
    setSaving(true);
    await saveSemesterSettings({ start_date: new Date(trimmedStart).toISOString(), total_weeks: totalWeeks });
    setSaving(false);
    setMessage('设置已保存');
    setSemesterEditing(false);
  };

  const handleSaveSyncToken = async () => {
    if (isSavingToken) return;
    setIsSavingToken(true);
    try {
      const trimmed = syncTokenInput.trim();
      await saveSyncToken(trimmed);
      setSyncTokenInput('');
      if (trimmed.length > 0) {
        const scheduler = getConfiguredSyncScheduler();
        scheduler.start();
        await scheduler.pullNow();
      }
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '保存 token 失败，请稍后重试。');
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleManualSync = async () => {
    const scheduler = getConfiguredSyncScheduler();
    scheduler.notifyLocalChange();
    await scheduler.pullNow();
  };

  const handleExportRatings = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const result = await exportLocalRatingsAsJson();
      Alert.alert('导出打分数据', `已准备 ${result.count} 条打分记录。`);
    } catch (error) {
      Alert.alert('导出打分数据失败', error instanceof Error ? error.message : '导出打分数据失败，请稍后重试。');
    } finally {
      setIsExporting(false);
    }
  };

  const resetImportState = React.useCallback(() => {
    importGenerationRef.current += 1;
    setImportModalVisible(false);
    setImportStatus('idle');
    setImportErrorMessage('');
    setImportedCount(undefined);
    setImportedTermCode(undefined);
    setHasStartedImport(false);
  }, []);

  const handleBeginImport = React.useCallback(() => {
    importGenerationRef.current += 1;
    setImportErrorMessage('');
    setImportedCount(undefined);
    setImportedTermCode(undefined);
    setHasStartedImport(true);
    setImportStatus('waiting-login');
  }, []);

  const handleScheduleDetailReady = React.useCallback(
    async ({ termCode, scheduleDetail, semesterStart, totalWeeks }: { termCode: string; scheduleDetail: WhutCourseTableResponseRaw; semesterStart?: string; totalWeeks?: number }) => {
      const generation = importGenerationRef.current;
      try {
        const startDate = semesterStart || form.semesterStart.trim();
        const weeks = totalWeeks ?? (Number.parseInt(form.totalWeeks.trim(), 10) || 30);
        if (!startDate) throw new Error('未能自动获取开学日期，请在设置中手动填写后重试。');
        const arrangedList = extractArrangedScheduleItems(scheduleDetail);
        if (arrangedList.length === 0) throw new Error('课表接口未返回任何可导入的排课记录。');
        const importedEvents = await importWhutArrangedList({ arrangedList, semesterConfig: { start_date: startDate, total_weeks: weeks } });
        if (generation !== importGenerationRef.current) return;
        setImportedCount(importedEvents.length);
        setImportedTermCode(termCode);
        setImportErrorMessage('');
        setImportStatus('success');
      } catch (error) {
        if (generation !== importGenerationRef.current) return;
        setImportedCount(undefined);
        setImportedTermCode(undefined);
        setImportStatus('error');
        setImportErrorMessage(error instanceof Error ? error.message : '导入课表失败，请稍后重试。');
      }
    },
    [form.semesterStart, form.totalWeeks],
  );

  const handleRequestCloseImportModal = () => {
    if (!hasStartedImport || importStatus === 'success' || importStatus === 'error') {
      resetImportState();
      return;
    }
    Alert.alert('取消导入', '当前导入流程尚未完成，确定要取消吗？', [
      { text: '继续导入', style: 'cancel' },
      { text: '确认取消', style: 'destructive', onPress: resetImportState },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { borderBottomColor: p.ink }]}>
        <Text style={[styles.kicker, { color: p.subtle }]}>Preferences</Text>
        <Text style={[styles.title, { color: p.ink }]}>Settings</Text>
      </View>
      <ScrollView style={styles.scroll}>
        <MinSettingsBlock p={p} title="Theme">
          <View style={[styles.row, { borderBottomColor: p.line }]}>
            <View style={styles.flex}>
              <Text style={[styles.rowLabel, { color: p.subtle }]}>Current</Text>
              <Text style={[styles.rowValue, { color: p.ink }]}>Minimal</Text>
            </View>
            <Pressable onPress={() => setThemeName('cyber')} style={[styles.outlineBtn, { borderColor: p.ink }]}>
              <Text style={[styles.outlineText, { color: p.ink }]}>Change</Text>
            </Pressable>
          </View>
        </MinSettingsBlock>

        <MinSettingsBlock p={p} title="Palette" subtitle="Color variant within the Minimal theme">
          <View style={styles.paletteGrid}>
            {palettes.map((palette) => (
              <MinPaletteCell key={palette.id} p={p} palette={palette} selected={palette.id === paletteId} onPress={() => setThemeName(palette.id)} />
            ))}
          </View>
        </MinSettingsBlock>

        <MinSettingsBlock p={p} title="Semester">
          {semesterEditing ? (
            <View>
              <TextInput value={form.semesterStart} onChangeText={(value) => updateField('semesterStart', value)} placeholder="YYYY-MM-DD" placeholderTextColor={p.dim} style={[styles.input, { color: p.ink, borderColor: p.line }]} />
              <TextInput value={form.totalWeeks} onChangeText={(value) => updateField('totalWeeks', value.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="18" placeholderTextColor={p.dim} style={[styles.input, { color: p.ink, borderColor: p.line }]} />
              <View style={styles.actions}>
                <MinSheetBtn p={p} label="Cancel" onPress={() => setSemesterEditing(false)} />
                <MinSheetBtn p={p} label={saving ? 'Saving' : 'Save'} primary flex={2} onPress={handleSaveSemester} />
              </View>
            </View>
          ) : (
            <>
              <MinSheetRow p={p} label="Start" value={loading ? '...' : form.semesterStart || '—'} />
              <MinSheetRow p={p} label="Current" value={`Week ${currentWeek}`} />
              <MinSheetRow p={p} label="Total" value={`${form.totalWeeks || '—'} weeks`} />
              <Pressable onPress={() => setSemesterEditing(true)} style={styles.blockAction}>
                <Text style={[styles.outlineText, { color: p.ink }]}>Edit</Text>
              </Pressable>
            </>
          )}
        </MinSettingsBlock>

        <MinSettingsBlock p={p} title="Schedule Import">
          <SettingAction p={p} label="Import from WHUT" action="Import" onPress={() => setImportModalVisible(true)} />
        </MinSettingsBlock>

        <MinSettingsBlock p={p} title="Cloud Sync">
          <TextInput value={syncTokenInput} onChangeText={setSyncTokenInput} secureTextEntry placeholder="Paste API token" placeholderTextColor={p.dim} autoCapitalize="none" autoCorrect={false} style={[styles.input, { color: p.ink, borderColor: p.line }]} />
          <SettingAction p={p} label="Token" value={syncTokenInput ? '••••••••••' : '—'} action={isSavingToken ? 'Saving' : 'Paste'} onPress={handleSaveSyncToken} />
          <MinSheetRow p={p} label="Last sync" value={describeSyncStatus(syncStatus, relativeTimeTick)} />
          <Pressable onPress={handleManualSync} style={styles.blockAction}>
            <Text style={[styles.outlineText, { color: p.ink }]}>Sync now</Text>
          </Pressable>
        </MinSettingsBlock>

        <MinSettingsBlock p={p} title="Data">
          <SettingAction p={p} label="Export ratings as JSON" action={isExporting ? 'Exporting' : 'Export'} onPress={handleExportRatings} />
        </MinSettingsBlock>
        {message ? <Text style={[styles.message, { color: p.subtle }]}>{message}</Text> : null}
        <View style={styles.spacer} />
      </ScrollView>

      <WhutImportModal
        errorMessage={importErrorMessage}
        importedCount={importedCount}
        importedTermCode={importedTermCode}
        onBeginImport={handleBeginImport}
        onImportError={setImportErrorMessage}
        onImportStatusChange={setImportStatus}
        onScheduleDetailReady={handleScheduleDetailReady}
        onRequestClose={handleRequestCloseImportModal}
        semesterConfig={{ start_date: form.semesterStart.trim(), total_weeks: Number.parseInt(form.totalWeeks.trim(), 10) || 30 }}
        status={importStatus}
        visible={isImportModalVisible}
      />
    </View>
  );
}

function SettingAction({ p, label, value, action, onPress }: { p: MinimalPaletteColors; label: string; value?: string; action: string; onPress: () => void }) {
  return (
    <View style={[styles.row, { borderBottomColor: p.line }]}>
      <View style={styles.flex}>
        <Text style={[styles.rowLabel, { color: p.subtle }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: p.ink }]}>{value}</Text> : null}
      </View>
      <Pressable onPress={onPress} style={[styles.outlineBtn, { borderColor: p.ink }]}>
        <Text style={[styles.outlineText, { color: p.ink }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 36, fontWeight: '600', marginTop: 6 },
  scroll: { flex: 1 },
  row: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  flex: { flex: 1 },
  rowLabel: { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  rowValue: { fontSize: 17, fontWeight: '500', marginTop: 3 },
  outlineBtn: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  outlineText: { fontSize: 10, letterSpacing: 1.8, fontWeight: '700', textTransform: 'uppercase' },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  actions: { flexDirection: 'row', marginTop: 8, marginBottom: 10 },
  blockAction: { alignSelf: 'flex-end', paddingVertical: 12 },
  message: { paddingHorizontal: 20, paddingTop: 14, fontSize: 12 },
  spacer: { height: 40 },
});
