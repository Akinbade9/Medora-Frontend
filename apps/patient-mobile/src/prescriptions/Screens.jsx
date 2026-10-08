import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { ArrowLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { AppText } from '../ui/AppText';
import { theme } from '../theme';
import { apiGet } from '../auth/client';
import {
  displayDate,
  friendlyError,
  substitutionLabels,
  validatePrescription,
} from './data';
import { usePrescription } from './usePrescription';

function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  label,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        (pressed || disabled) && styles.dim,
      ]}
    >
      <AppText
        weight="semibold"
        style={secondary ? styles.secondaryText : styles.buttonText}
      >
        {children}
      </AppText>
    </Pressable>
  );
}
function State({ resource }) {
  if (resource.loading)
    return (
      <View
        style={styles.state}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading prescriptions"
      >
        <ActivityIndicator color={theme.colors.primary} />
        <AppText>Loading your prescriptions...</AppText>
      </View>
    );
  if (resource.error)
    return (
      <View style={styles.card}>
        <AppText accessibilityRole="alert">{resource.error}</AppText>
        <Button secondary onPress={resource.reload}>
          Try again
        </Button>
      </View>
    );
  return null;
}
function Status({ value }) {
  return (
    <View style={styles.badge}>
      <AppText
        weight="semibold"
        style={[styles.badgeText, value === 'CANCELLED' && styles.danger]}
      >
        {value}
      </AppText>
    </View>
  );
}
function PrescriptionCard({ prescription: p, onOpen }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Open prescription ' + p.publicCode}
      onPress={() => onOpen(p._id)}
      style={({ pressed }) => [styles.card, pressed && styles.dim]}
    >
      <View style={styles.row}>
        <AppText weight="semibold" style={styles.flex}>
          {p.publicCode}
        </AppText>
        <Status value={p.status} />
      </View>
      <AppText weight="medium">
        {p.doctor?.displayName ?? 'Doctor information unavailable'}
      </AppText>
      <AppText style={styles.muted}>
        {p.hospital?.name ?? 'Hospital information unavailable'}
      </AppText>
      <AppText style={styles.muted}>Issued {displayDate(p.issuedAt)}</AppText>
      <AppText>
        {p.medications
          .slice(0, 2)
          .map((m) => m.genericName)
          .join(' / ')}
        {p.medications.length > 2
          ? ' + ' + (p.medications.length - 2) + ' more'
          : ''}
      </AppText>
      <View style={styles.row}>
        <AppText weight="medium" style={styles.link}>
          View prescription
        </AppText>
        <ChevronRight size={18} color={theme.colors.primary} />
      </View>
    </Pressable>
  );
}
export function PatientHome({ onOpen, onBrowse }) {
  const resource = usePrescription(
    'patient/prescriptions?view=active&page=1&limit=1',
    true,
  );
  return (
    <View style={styles.stack}>
      <AppText
        accessibilityRole="header"
        weight="semibold"
        style={styles.subtitle}
      >
        Your next step
      </AppText>
      <State resource={resource} />
      {resource.data &&
        (resource.data.items.length ? (
          <>
            <AppText style={styles.muted}>
              Review your latest prescription and the instructions from your
              doctor.
            </AppText>
            <PrescriptionCard
              prescription={resource.data.items[0]}
              onOpen={onOpen}
            />
          </>
        ) : (
          <View style={styles.card}>
            <AppText weight="semibold">You are up to date</AppText>
            <AppText style={styles.muted}>
              No active prescriptions right now. Your past prescriptions are in
              History.
            </AppText>
          </View>
        ))}
      <Button onPress={onBrowse}>View all prescriptions</Button>
    </View>
  );
}
export function PatientPrescriptions({ selectedId, onSelect, onNavigate }) {
  const [view, setView] = useState('active');
  const [page, setPage] = useState(1);
  if (selectedId)
    return (
      <PrescriptionDetails
        onNavigate={onNavigate}
        key={selectedId}
        id={selectedId}
        onBack={() => onSelect(null)}
      />
    );
  return (
    <View style={styles.stack}>
      <View accessibilityRole="tablist" style={styles.segments}>
        {['active', 'history'].map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityLabel={option === 'active' ? 'Active' : 'History'}
            accessibilityState={{ selected: view === option }}
            onPress={() => {
              setView(option);
              setPage(1);
            }}
            style={[styles.segment, view === option && styles.selected]}
          >
            <AppText
              weight="semibold"
              style={view === option ? styles.selectedText : styles.muted}
            >
              {option === 'active' ? 'Active' : 'History'}
            </AppText>
          </Pressable>
        ))}
      </View>
      <PrescriptionList
        key={view + page}
        view={view}
        page={page}
        onPage={setPage}
        onOpen={onSelect}
      />
    </View>
  );
}
function PrescriptionList({ view, page, onPage, onOpen }) {
  const resource = usePrescription(
    'patient/prescriptions?view=' + view + '&page=' + page + '&limit=10',
    true,
  );
  return (
    <View style={styles.stack}>
      <AppText style={styles.muted}>
        {view === 'active'
          ? 'Your current prescriptions, ready to review.'
          : 'Your cancelled and expired prescriptions.'}
      </AppText>
      <State resource={resource} />
      {resource.data && (
        <>
          {!resource.data.items.length && (
            <View style={styles.card}>
              <AppText weight="semibold">
                {view === 'active'
                  ? 'No active prescriptions'
                  : 'No prescription history yet'}
              </AppText>
              <AppText style={styles.muted}>
                {page > 1
                  ? 'There are no prescriptions on this page. Go back or refresh the list.'
                  : view === 'active'
                    ? 'When your doctor issues a prescription, it will appear here.'
                    : 'Past prescriptions will appear here when they are cancelled or expire.'}
              </AppText>
            </View>
          )}
          {resource.data.items.map((p) => (
            <PrescriptionCard key={p._id} prescription={p} onOpen={onOpen} />
          ))}
          <View style={styles.row}>
            <Button
              secondary
              disabled={page <= 1}
              onPress={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <AppText style={styles.muted}>Page {page}</AppText>
            <Button
              secondary
              disabled={page * resource.data.limit >= resource.data.total}
              onPress={() => onPage(page + 1)}
            >
              Next
            </Button>
          </View>
          <Button secondary onPress={resource.reload}>
            Refresh prescriptions
          </Button>
        </>
      )}
    </View>
  );
}
function PrescriptionDetails({ id, onBack, onNavigate }) {
  const resource = usePrescription(
    'patient/prescriptions/' + encodeURIComponent(id),
  );
  const [matching, setMatching] = useState(false);
  useEffect(() => {
    onNavigate?.();
  }, [matching, onNavigate]);
  const [checking, setChecking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [checked, setChecked] = useState(null);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (matching) setMatching(false);
      else onBack();
      return true;
    });
    return () => listener.remove();
  }, [matching, onBack]);
  async function findMedication() {
    if (checking) return;
    setChecking(true);
    setActionError('');
    try {
      const latest = validatePrescription(
        await apiGet('patient/prescriptions/' + encodeURIComponent(id)),
      );
      setChecked(latest);
      if (latest.isActive) setMatching(true);
      else {
        setActionError('This prescription is no longer active.');
        resource.reload();
      }
    } catch (error) {
      setActionError(friendlyError(error));
    } finally {
      setChecking(false);
    }
  }
  if (matching)
    return (
      <View style={styles.stack}>
        <Button
          secondary
          onPress={() => {
            setMatching(false);
            resource.reload();
          }}
        >
          Back to prescription
        </Button>
        <View style={styles.placeholder}>
          <MapPin size={36} color={theme.colors.primary} />
          <AppText
            accessibilityRole="header"
            weight="semibold"
            style={styles.subtitle}
          >
            Find My Medication
          </AppText>
          <AppText>
            We will help you find verified pharmacies that have your
            prescription available.
          </AppText>
          <AppText style={styles.muted}>
            Pharmacy matching is coming soon. No pharmacy search or reservation
            has been made.
          </AppText>
          <AppText weight="medium">{checked?.publicCode}</AppText>
        </View>
      </View>
    );
  const p = resource.data;
  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to prescriptions"
        onPress={onBack}
        style={styles.back}
      >
        <ArrowLeft color={theme.colors.primary} size={20} />
        <AppText style={styles.link}>Back to prescriptions</AppText>
      </Pressable>
      <State resource={resource} />
      {p && (
        <>
          <View style={styles.card}>
            <AppText style={styles.muted}>Prescription details</AppText>
            <AppText
              accessibilityRole="header"
              weight="bold"
              style={styles.subtitle}
            >
              {p.publicCode}
            </AppText>
            <Status value={p.status} />
            <AppText weight="semibold">Prescribed by</AppText>
            <AppText>
              {p.doctor?.displayName ?? 'Doctor information unavailable'}
            </AppText>
            <AppText style={styles.muted}>
              {p.hospital?.name ?? 'Hospital information unavailable'}
            </AppText>
            <AppText>Issued: {displayDate(p.issuedAt)}</AppText>
            <AppText>
              Expires:{' '}
              {p.expiresAt ? displayDate(p.expiresAt) : 'No expiry specified'}
            </AppText>
            {p.cancelledAt && (
              <AppText>Cancelled: {displayDate(p.cancelledAt)}</AppText>
            )}
            {p.cancellationReason && (
              <AppText style={styles.danger}>
                Cancellation reason: {p.cancellationReason}
              </AppText>
            )}
          </View>
          <AppText
            accessibilityRole="header"
            weight="semibold"
            style={styles.subtitle}
          >
            Your medicines
          </AppText>
          {p.medications.map((m, index) => (
            <View key={index} style={styles.card}>
              <AppText
                accessibilityRole="header"
                weight="semibold"
                style={styles.medicineTitle}
              >
                {index + 1}. {m.genericName}
              </AppText>
              {(m.strength != null || m.dosageForm) && (
                <AppText style={styles.muted}>
                  {[
                    m.strength != null
                      ? [m.strength, m.strengthUnit]
                          .filter((v) => v != null)
                          .join(' ')
                      : null,
                    m.dosageForm,
                  ]
                    .filter(Boolean)
                    .join(' / ')}
                </AppText>
              )}
              {m.brandName && <AppText>Brand: {m.brandName}</AppText>}
              <AppText>Quantity: {m.quantity}</AppText>
              <AppText weight="semibold">Dosage instructions</AppText>
              <AppText>{m.dosageInstructions}</AppText>
              <AppText>Frequency: {m.frequency}</AppText>
              <AppText>Duration: {m.duration}</AppText>
              <View style={styles.rule}>
                <AppText style={styles.link}>
                  {substitutionLabels[m.substitutionRule]}
                </AppText>
              </View>
            </View>
          ))}
          <AppText style={styles.muted}>
            Follow your doctor's instructions. Contact your care provider if you
            have questions about this prescription.
          </AppText>
          {actionError && (
            <AppText accessibilityRole="alert" style={styles.danger}>
              {actionError}
            </AppText>
          )}
          {p.isActive ? (
            <Button
              disabled={checking}
              onPress={() => {
                void findMedication();
              }}
            >
              {checking ? 'Checking prescription...' : 'Find My Medication'}
            </Button>
          ) : (
            <View style={styles.card}>
              <AppText>
                This prescription is {p.status.toLowerCase()} and cannot be used
                to find medication.
              </AppText>
            </View>
          )}
          <Button secondary onPress={resource.reload}>
            Refresh prescription
          </Button>
        </>
      )}
    </View>
  );
}
const { colors: c, space: s, radius: r, fontSize: f } = theme;
const styles = StyleSheet.create({
  stack: { gap: s.lg },
  card: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.medium,
    padding: s.xl,
    gap: s.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s.sm,
    flexWrap: 'wrap',
  },
  flex: { flexShrink: 1 },
  muted: { color: c.muted, fontSize: f.small },
  link: { color: c.primaryDark },
  danger: { color: c.danger },
  subtitle: { fontSize: f.subtitle, lineHeight: 28 },
  medicineTitle: { fontSize: f.body, lineHeight: 24 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: c.blueSoft,
    borderRadius: r.full,
    paddingHorizontal: s.md,
    paddingVertical: s.xs,
  },
  badgeText: { color: c.primaryDark, fontSize: f.caption },
  button: {
    minHeight: 48,
    backgroundColor: c.primary,
    borderRadius: r.small,
    padding: s.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: c.card, fontSize: f.small },
  secondaryButton: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.primary,
  },
  secondaryText: { color: c.primaryDark, fontSize: f.small },
  dim: { opacity: 0.6 },
  state: { alignItems: 'center', gap: s.lg, padding: s.xxl },
  segments: {
    flexDirection: 'row',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.small,
    padding: s.xs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: r.small,
  },
  selected: { backgroundColor: c.primary },
  selectedText: { color: c.card },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    minHeight: 48,
  },
  rule: {
    padding: s.md,
    backgroundColor: c.primarySoft,
    borderRadius: r.small,
  },
  placeholder: {
    backgroundColor: c.primarySoft,
    padding: s.xxl,
    borderRadius: r.large,
    gap: s.lg,
  },
});
