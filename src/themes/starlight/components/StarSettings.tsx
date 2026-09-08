import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { saveSyncToken } from '../../../features/rating';
import { useAggregateSyncStatus } from '../../../features/settings/hooks/useAggregateSyncStatus';
import {
  pullAllNow,
  startAllSyncSchedulers,
  syncAllNow,
} from '../../../features/settings/services/sync-control.service';
import type { CloudSyncStatus } from '../../../shared/sync';
import { useThemeSettings } from '../../../theme/ThemeContext';
import { loadSettings, saveSemesterSettings } from '../../../features/settings/services/settings.service';
import { exportLocalRatingsAsJson } from '../../../features/settings/services/rating-export.service';
import {
  WhutCourseTableResponseRaw,
  extractArrangedScheduleItems,
  importWhutArrangedList,
} from '../../../features/schedule';
import { WhutImportModal, WhutImportStatus } from '../../../features/schedule/import/WhutImportModal';
import { legacyPackage } from '../../legacy/package';
import type { ThemePalette } from '../../types';
import { StarlightPaletteCell } from './parts/StarlightPaletteCell';
import { StarlightSheetBtn } from './parts/StarlightSheetBtn';
import { StarlightSheetRow } from './parts/StarlightSheetRow';
import type { StarlightPaletteColors } from './starlightTypes';

type Props = {
  p: StarlightPaletteColors;
  paletteId: string;
  palettes: ThemePalette[];
  onSelectPalette?: (id: string) => void;
};

const RELATIVE_TIME_REFRESH_MS = 30_000;
const STARLIGHT_EXIT_THEME_ID = legacyPackage.palettes[0].id;

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

function describeSyncStatus(status: CloudSyncStatus, now: number): string {
  if (status.kind === 'unconfigured') return '未配置云端同步';
  if (status.kind === 'syncing') return '同步中...';
  if (status.kind === 'error') return status.message;
  return status.lastSyncAt ? `同步于 ${formatRelativeSyncTime(status.lastSyncAt, now)}` : '尚未同步';
}

export function StarSettings({ p, paletteId, palettes, onSelectPalette }: Props) {
  const { setThemeName } = useThemeSettings();
  const selectPalette = onSelectPalette ?? setThemeName;
  const current = palettes.find((palette) => palette.id === paletteId);

  const [form, setForm] = React.useState({ semesterStart: '', totalWeeks: '' });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [semesterEditing, setSemesterEditing] = React.useState(false);
  const [syncTokenInput, setSyncTokenInput] = React.useState('');
  const [isSavingToken, setIsSavingToken] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  // One line covering ratings + schedule + todos.
  const syncStatus = useAggregateSyncStatus();
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
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setMessage('');
  };

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
        startAllSyncSchedulers();
        await pullAllNow();
      }
    } catch (error) {
      Alert.alert('保存失败', error instanceof Error ? error.message : '保存 token 失败，请稍后重试。');
    } finally {
      setIsSavingToken(false);
    }
  };

  const handleManualSync = async () => {
    await syncAllNow();
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
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: p.subtle }]}>Ambience</Text>
        <Text style={[styles.title, { color: p.ink }]}>Settings</Text>
      </View>
      <ScrollView testID="starlight-settings" style={styles.scroll}>
        <StarSettingsBlock p={p} title="Theme">
          <View style={[styles.row, { borderBottomColor: p.line }]}>
            <View style={styles.flex}>
              <Text style={[styles.rowLabel, { color: p.subtle }]}>Current</Text>
              <Text style={[styles.rowValue, { color: p.ink }]}>{current?.label ?? 'Starlight'}</Text>
              <Text
                testID="starlight-settings-current-palette-id"
                style={[styles.rowSub, { color: p.subtle }]}
              >
                {paletteId}
              </Text>
            </View>
            <Pressable
              onPress={() => setThemeName(STARLIGHT_EXIT_THEME_ID)}
              style={({ pressed }) => [
                styles.outlineBtn,
                {
                  borderColor: p.accent,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={[styles.outlineText, { color: p.accent }]}>Change</Text>
            </Pressable>
          </View>
        </StarSettingsBlock>

        <StarSettingsBlock p={p} title="Palette" subtitle="Color variant within the Starlight theme">
          <View style={styles.paletteGrid}>
            {palettes.map((palette) => (
              <StarlightPaletteCell
                key={palette.id}
                p={p}
                palette={palette}
                selected={palette.id === paletteId}
                onPress={() => selectPalette(palette.id)}
                testID={`starlight-palette-${palette.id}`}
                selectedTestID={`starlight-palette-active-${palette.id}`}
              />
            ))}
          </View>
        </StarSettingsBlock>

        <StarSettingsBlock p={p} title="Semester">
          {semesterEditing ? (
            <View>
              <TextInput
                value={form.semesterStart}
                onChangeText={(value) => updateField('semesterStart', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={p.dim}
                style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: p.panel }]}
              />
              <TextInput
                value={form.totalWeeks}
                onChangeText={(value) => updateField('totalWeeks', value.replace(/[^\d]/g, ''))}
                keyboardType="number-pad"
                placeholder="18"
                placeholderTextColor={p.dim}
                style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: p.panel }]}
              />
              <View style={styles.actions}>
                <StarlightSheetBtn p={p} label="Cancel" onPress={() => setSemesterEditing(false)} />
                <StarlightSheetBtn p={p} label={saving ? 'Saving' : 'Save'} primary flex={2} onPress={handleSaveSemester} />
              </View>
            </View>
          ) : (
            <>
              <StarlightSheetRow p={p} label="Start" value={loading ? '...' : form.semesterStart || '—'} />
              <StarlightSheetRow p={p} label="Current" value={`Week ${currentWeek}`} />
              <StarlightSheetRow p={p} label="Total" value={`${form.totalWeeks || '—'} weeks`} />
              <Pressable
                onPress={() => setSemesterEditing(true)}
                style={({ pressed }) => [styles.blockAction, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={[styles.outlineText, { color: p.accent }]}>Edit</Text>
              </Pressable>
            </>
          )}
        </StarSettingsBlock>

        <StarSettingsBlock p={p} title="Schedule Import">
          <SettingAction p={p} label="Import from WHUT" action="Import" onPress={() => setImportModalVisible(true)} />
        </StarSettingsBlock>

        <StarSettingsBlock p={p} title="Cloud Sync">
          <TextInput
            value={syncTokenInput}
            onChangeText={setSyncTokenInput}
            secureTextEntry
            placeholder="Paste API token"
            placeholderTextColor={p.dim}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: p.ink, borderColor: p.line, backgroundColor: p.panel }]}
          />
          <SettingAction p={p} label="Token" value={syncTokenInput ? '••••••••••' : '—'} action={isSavingToken ? 'Saving' : 'Paste'} onPress={handleSaveSyncToken} />
          <StarlightSheetRow p={p} label="Last sync" value={describeSyncStatus(syncStatus, relativeTimeTick)} />
          <Pressable
            onPress={handleManualSync}
            style={({ pressed }) => [styles.blockAction, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={[styles.outlineText, { color: p.accent }]}>Sync now</Text>
          </Pressable>
        </StarSettingsBlock>

        <StarSettingsBlock p={p} title="Data">
          <SettingAction p={p} label="Export ratings as JSON" action={isExporting ? 'Exporting' : 'Export'} onPress={handleExportRatings} />
        </StarSettingsBlock>
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

function StarSettingsBlock({
  p,
  title,
  subtitle,
  children,
}: {
  p: StarlightPaletteColors;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.block, { borderColor: p.line }]}>
      <BlurView
        intensity={24}
        tint={p.dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: p.panel }]} />
      <LinearGradient
        colors={p.dark ? ['rgba(255,255,255,0.05)', `${p.accent}12`, 'rgba(255,255,255,0.01)'] : ['rgba(255,255,255,0.62)', `${p.accent}10`, 'rgba(255,255,255,0.18)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={[styles.blockGlint, { backgroundColor: p.dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.78)' }]} />
      <Text style={[styles.blockTitle, { color: p.subtle, marginBottom: subtitle ? 4 : 10 }]}>{title}</Text>
      {subtitle ? <Text style={[styles.blockSubtitle, { color: p.subtle }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function SettingAction({
  p,
  label,
  value,
  action,
  onPress,
}: {
  p: StarlightPaletteColors;
  label: string;
  value?: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: p.line }]}>
      <View style={styles.flex}>
        <Text style={[styles.rowLabel, { color: p.subtle }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: p.ink }]}>{value}</Text> : null}
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.outlineBtn,
          {
            borderColor: p.accent,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Text style={[styles.outlineText, { color: p.accent }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 32, paddingHorizontal: 22, paddingBottom: 14 },
  kicker: { fontFamily: 'NotoSansSC-Medium', fontSize: 10, letterSpacing: 3, fontWeight: '500', textTransform: 'uppercase' },
  title: { marginTop: 6, fontFamily: 'NotoSerifSC-Regular', fontSize: 36, lineHeight: 42, letterSpacing: -0.8, fontStyle: 'italic' },
  scroll: { flex: 1 },
  block: { marginHorizontal: 22, marginTop: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  blockGlint: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, opacity: 0.85 },
  blockTitle: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  blockSubtitle: { marginBottom: 10, fontFamily: 'NotoSansSC-Regular', fontSize: 12, fontStyle: 'italic' },
  row: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  flex: { flex: 1 },
  rowLabel: { fontFamily: 'NotoSansSC-SemiBold', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase' },
  rowValue: { marginTop: 3, fontFamily: 'NotoSansSC-Medium', fontSize: 17, fontWeight: '500' },
  rowSub: { marginTop: 2, fontFamily: 'NotoSansSC-Regular', fontSize: 11, letterSpacing: 0.8 },
  outlineBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  outlineText: { fontFamily: 'NotoSansSC-Bold', fontSize: 10, letterSpacing: 1.8, fontWeight: '700', textTransform: 'uppercase' },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  input: { marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'NotoSansSC-Medium', fontSize: 14, borderWidth: 1, borderRadius: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 10 },
  blockAction: { alignSelf: 'flex-end', paddingVertical: 12 },
  message: { paddingHorizontal: 22, paddingTop: 14, fontFamily: 'NotoSansSC-Regular', fontSize: 12 },
  spacer: { height: 40 },
});
