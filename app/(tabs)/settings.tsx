import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import {
  User,
  Bell,
  LogOut,
  ChevronRight,
  Moon,
  CreditCard,
  LayoutGrid,
  CalendarDays,
  Check,
  X,
  Edit2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";
import { useProfile } from "@/hooks/useProfile";
import { ManageCollectionsModal } from "@/components/ManageCollectionsModal";

// ── Currency options ──────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "DZD", label: "Algerian Dinar" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "MAD", label: "Moroccan Dirham" },
  { code: "TND", label: "Tunisian Dinar" },
  { code: "EGP", label: "Egyptian Pound" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "AED", label: "UAE Dirham" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "INR", label: "Indian Rupee" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "MXN", label: "Mexican Peso" },
  { code: "TRY", label: "Turkish Lira" },
  { code: "KRW", label: "South Korean Won" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "SEK", label: "Swedish Krona" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAppStore();
  const { profile, prefs, updateProfile, updatePrefs } = useProfile();
  const [loading, setLoading] = useState(false);
  const [isCollectionsModalVisible, setIsCollectionsModalVisible] = useState(false);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const [isPaydayModalVisible, setIsPaydayModalVisible] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.display_name ?? "");

  // Quiet hours are buffered locally — we only save on blur so we never
  // persist a partial string like "22:" or an invalid format like "10pm".
  const [quietStart, setQuietStart] = useState(prefs?.quiet_hours_start ?? "22:00");
  const [quietEnd, setQuietEnd]     = useState(prefs?.quiet_hours_end   ?? "08:00");
  const [quietStartError, setQuietStartError] = useState(false);
  const [quietEndError, setQuietEndError]     = useState(false);

  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setEmail(session.user.email ?? null);
    });
  }, []);

  // Keep nameInput in sync when profile loads
  useEffect(() => {
    if (profile?.display_name) setNameInput(profile.display_name);
  }, [profile?.display_name]);

  // Keep quiet hours inputs in sync when prefs load
  useEffect(() => {
    if (prefs?.quiet_hours_start) setQuietStart(prefs.quiet_hours_start);
    if (prefs?.quiet_hours_end)   setQuietEnd(prefs.quiet_hours_end);
  }, [prefs?.quiet_hours_start, prefs?.quiet_hours_end]);

  async function handleSignOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) showAlert("Error", error.message, "error");
    setLoading(false);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try {
      await updateProfile({ display_name: trimmed });
      setIsEditingName(false);
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not update name.", "error");
    }
  }

  async function handleForgotPassword() {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "pausy://reset-password",
      });
      if (error) throw error;
      showAlert(
        "Check your inbox",
        `We sent a password reset link to ${email}.`,
        "success"
      );
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not send reset email.", "error");
    }
  }

  async function handleSelectCurrency(code: string) {
    setIsCurrencyModalVisible(false);
    try {
      await updateProfile({ currency: code });
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not update currency.", "error");
    }
  }

  async function handleSelectPayday(day: number) {
    setIsPaydayModalVisible(false);
    try {
      await updateProfile({ payday_day: day });
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not update payday.", "error");
    }
  }

  // ── Quiet hours ───────────────────────────────────────────────────────────
  // Validates "HH:MM" format (00:00–23:59) and returns true if valid.
  function isValidTime(value: string): boolean {
    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return false;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }

  async function handleQuietStartBlur() {
    if (!isValidTime(quietStart)) {
      setQuietStartError(true);
      return;
    }
    setQuietStartError(false);
    try {
      await updatePrefs({ quiet_hours_start: quietStart });
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not save quiet hours.", "error");
    }
  }

  async function handleQuietEndBlur() {
    if (!isValidTime(quietEnd)) {
      setQuietEndError(true);
      return;
    }
    setQuietEndError(false);
    try {
      await updatePrefs({ quiet_hours_end: quietEnd });
    } catch (e: any) {
      showAlert("Error", e?.message ?? "Could not save quiet hours.", "error");
    }
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-[#EEEBDA]"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 20) + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-10 pb-4">
          <Text className="text-4xl font-fancy text-[#282B4A]">Settings</Text>
          <Text className="text-[13px] text-[#282B4A]/40 font-medium mt-2">
            Personalize your patience experience.
          </Text>
        </View>

        {/* Profile card */}
        <View className="px-6 items-center py-6">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-sm border border-[#282B4A]/5">
            <User size={48} color="#282B4A" opacity={0.6} />
          </View>

          {isEditingName ? (
            <View className="flex-row items-center gap-2 mt-1">
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                className="bg-white border border-[#282B4A]/10 rounded-2xl px-4 h-10 text-[#282B4A] font-bold text-lg min-w-[160px] text-center"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity
                onPress={handleSaveName}
                className="p-2 bg-[#282B4A] rounded-xl"
              >
                <Check size={18} color="#EEEBDA" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsEditingName(false);
                  setNameInput(profile?.display_name ?? "");
                }}
                className="p-2 bg-[#282B4A]/10 rounded-xl"
              >
                <X size={18} color="#282B4A" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditingName(true)}
              className="flex-row items-center gap-2 mt-1"
              activeOpacity={0.7}
            >
              <Text className="text-2xl font-bold text-[#282B4A]">
                {profile?.display_name ?? "—"}
              </Text>
              <Edit2 size={14} color="rgba(40,43,74,0.4)" />
            </TouchableOpacity>
          )}

          <Text className="text-[#282B4A]/50 font-medium mt-1">{email}</Text>

          <TouchableOpacity
            onPress={handleForgotPassword}
            className="mt-4"
            activeOpacity={0.7}
          >
            <Text className="text-[11px] text-[#282B4A]/40 underline font-medium">
              Change password
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 gap-6 mt-4">
          {/* Collections */}
          <View className="gap-3">
            <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1">
              Collections
            </Text>
            <Card className="bg-white rounded-[32px] overflow-hidden border border-[#282B4A]/5 shadow-sm">
              <TouchableOpacity
                className="flex-row items-center justify-between p-5"
                onPress={() => setIsCollectionsModalVisible(true)}
              >
                <View className="flex-row items-center gap-3">
                  <LayoutGrid size={20} color="rgba(40,43,74,0.6)" />
                  <View>
                    <Text className="text-[#282B4A] font-medium">Manage Categories</Text>
                    <Text className="text-[11px] text-[#282B4A]/40">
                      Organize your wishlist items
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="rgba(40,43,74,0.3)" />
              </TouchableOpacity>
            </Card>
          </View>

          {/* Account */}
          <View className="gap-3">
            <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1">
              Account
            </Text>
            <View className="bg-white rounded-[32px] overflow-hidden border border-[#282B4A]/5 shadow-sm">
              {/* Currency */}
              <TouchableOpacity
                className="flex-row items-center justify-between p-5 border-b border-[#282B4A]/5"
                onPress={() => setIsCurrencyModalVisible(true)}
              >
                <View className="flex-row items-center gap-3">
                  <CreditCard size={20} color="rgba(40,43,74,0.6)" />
                  <Text className="text-[#282B4A] font-medium">Currency</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[#282B4A]/40 text-sm font-bold">
                    {profile?.currency ?? "—"}
                  </Text>
                  <ChevronRight size={16} color="rgba(40,43,74,0.3)" />
                </View>
              </TouchableOpacity>

              {/* Payday */}
              <TouchableOpacity
                className="flex-row items-center justify-between p-5"
                onPress={() => setIsPaydayModalVisible(true)}
              >
                <View className="flex-row items-center gap-3">
                  <CalendarDays size={20} color="rgba(40,43,74,0.6)" />
                  <View>
                    <Text className="text-[#282B4A] font-medium">Payday</Text>
                    <Text className="text-[11px] text-[#282B4A]/40">
                      Used for the "Payday" wait option
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[#282B4A]/40 text-sm font-bold">
                    {profile?.payday_day ? `Day ${profile.payday_day}` : "Not set"}
                  </Text>
                  <ChevronRight size={16} color="rgba(40,43,74,0.3)" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications */}
          <View className="gap-3">
            <Text className="text-[11px] font-bold text-[#282B4A]/40 uppercase tracking-widest ml-1">
              Notifications
            </Text>
            <View className="bg-white rounded-[32px] overflow-hidden border border-[#282B4A]/5 shadow-sm">
              <View className="flex-row items-center justify-between p-5 border-b border-[#282B4A]/5">
                <View className="flex-row items-center gap-3">
                  <Bell size={20} color="rgba(40,43,74,0.6)" />
                  <Text className="text-[#282B4A] font-medium">Global Reminders</Text>
                </View>
                <Switch
                  value={prefs?.global_enabled ?? true}
                  onValueChange={(val) => updatePrefs({ global_enabled: val })}
                  thumbColor="#EEEBDA"
                  trackColor={{ true: "#282B4A", false: "rgba(40,43,74,0.1)" }}
                />
              </View>

              {prefs?.global_enabled && (
                <>
                  <View className="p-5 border-b border-[#282B4A]/5">
                    <View className="flex-row items-center gap-3 mb-4">
                      <Moon size={20} color="rgba(40,43,74,0.6)" />
                      <Text className="text-[#282B4A] font-medium">Quiet Hours</Text>
                    </View>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase mb-1 ml-1">
                          Start
                        </Text>
                        <TextInput
                          value={quietStart}
                          onChangeText={(val) => {
                            setQuietStart(val);
                            setQuietStartError(false);
                          }}
                          onBlur={handleQuietStartBlur}
                          placeholder="22:00"
                          keyboardType="numbers-and-punctuation"
                          returnKeyType="done"
                          maxLength={5}
                          className={`rounded-xl px-4 h-10 font-medium ${
                            quietStartError
                              ? "bg-[#ef4444]/10 text-[#ef4444]"
                              : "bg-[#282B4A]/5 text-[#282B4A]"
                          }`}
                        />
                        {quietStartError && (
                          <Text className="text-[10px] text-[#ef4444] mt-1 ml-1">
                            Use HH:MM format
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] text-[#282B4A]/40 font-bold uppercase mb-1 ml-1">
                          End
                        </Text>
                        <TextInput
                          value={quietEnd}
                          onChangeText={(val) => {
                            setQuietEnd(val);
                            setQuietEndError(false);
                          }}
                          onBlur={handleQuietEndBlur}
                          placeholder="08:00"
                          keyboardType="numbers-and-punctuation"
                          returnKeyType="done"
                          maxLength={5}
                          className={`rounded-xl px-4 h-10 font-medium ${
                            quietEndError
                              ? "bg-[#ef4444]/10 text-[#ef4444]"
                              : "bg-[#282B4A]/5 text-[#282B4A]"
                          }`}
                        />
                        {quietEndError && (
                          <Text className="text-[10px] text-[#ef4444] mt-1 ml-1">
                            Use HH:MM format
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between p-5">
                    <View className="flex-row items-center gap-3">
                      <CalendarDays size={20} color="rgba(40,43,74,0.6)" />
                      <View>
                        <Text className="text-[#282B4A] font-medium">Weekly Digest</Text>
                        <Text className="text-[11px] text-[#282B4A]/40">
                          A summary of your patience wins
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={prefs?.notify_digest ?? false}
                      onValueChange={(val) => updatePrefs({ notify_digest: val })}
                      thumbColor="#EEEBDA"
                      trackColor={{ true: "#282B4A", false: "rgba(40,43,74,0.1)" }}
                    />
                  </View>
                </>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            disabled={loading}
            className="mt-6 h-14 rounded-2xl flex-row items-center justify-center gap-3 bg-[#ef4444]/10"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-[#ef4444] font-bold text-base">Sign Out</Text>
          </TouchableOpacity>

          <Text className="text-center text-[#282B4A]/30 text-[11px] font-bold uppercase tracking-widest mt-8 pb-10">
            Pausy v1.0.0 · Made with 🎀
          </Text>
        </View>
      </ScrollView>

      <ManageCollectionsModal
        visible={isCollectionsModalVisible}
        onClose={() => setIsCollectionsModalVisible(false)}
      />

      {/* ── Currency picker modal ─────────────────────────────────────────── */}
      <Modal
        visible={isCurrencyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCurrencyModalVisible(false)}
      >
        <View className="flex-1 bg-[#EEEBDA]">
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
            <Text className="text-2xl font-fancy text-[#282B4A]">Currency</Text>
            <TouchableOpacity
              onPress={() => setIsCurrencyModalVisible(false)}
              className="p-2"
            >
              <X size={24} color="#282B4A" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item.code}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isSelected = profile?.currency === item.code;
              return (
                <TouchableOpacity
                  onPress={() => handleSelectCurrency(item.code)}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between p-5 mb-3 rounded-3xl border ${
                    isSelected
                      ? "bg-[#282B4A] border-[#282B4A]"
                      : "bg-white border-[#282B4A]/5 shadow-sm"
                  }`}
                >
                  <View>
                    <Text
                      className={`font-bold text-base ${
                        isSelected ? "text-[#EEEBDA]" : "text-[#282B4A]"
                      }`}
                    >
                      {item.code}
                    </Text>
                    <Text
                      className={`text-[12px] font-medium mt-0.5 ${
                        isSelected ? "text-[#EEEBDA]/70" : "text-[#282B4A]/50"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && <Check size={20} color="#EEEBDA" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* ── Payday picker modal ───────────────────────────────────────────── */}
      <Modal
        visible={isPaydayModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsPaydayModalVisible(false)}
      >
        <View className="flex-1 bg-[#EEEBDA]">
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
            <View>
              <Text className="text-2xl font-fancy text-[#282B4A]">Payday</Text>
              <Text className="text-[13px] text-[#282B4A]/40 font-medium mt-1">
                Which day of the month do you get paid?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsPaydayModalVisible(false)}
              className="p-2"
            >
              <X size={24} color="#282B4A" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={Array.from({ length: 31 }, (_, i) => i + 1)}
            keyExtractor={(item) => String(item)}
            numColumns={4}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            renderItem={({ item: day }) => {
              const isSelected = profile?.payday_day === day;
              return (
                <TouchableOpacity
                  onPress={() => handleSelectPayday(day)}
                  activeOpacity={0.7}
                  className={`flex-1 h-16 rounded-2xl items-center justify-center border ${
                    isSelected
                      ? "bg-[#282B4A] border-[#282B4A]"
                      : "bg-white border-[#282B4A]/5 shadow-sm"
                  }`}
                >
                  <Text
                    className={`font-bold text-lg ${
                      isSelected ? "text-[#EEEBDA]" : "text-[#282B4A]"
                    }`}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}
