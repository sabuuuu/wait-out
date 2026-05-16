import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Link, Clipboard, ChevronDown, ChevronUp, Globe, Video, Instagram } from "lucide-react-native";

function detectType(url: string): "tiktok" | "instagram" | "web" | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com") || lower.includes("vm.tiktok")) return "tiktok";
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) return "instagram";
  return "web";
}

interface Props {
  sourceUrl: string;
  onChangeSource: (v: string) => void;
  tiktokUrl: string;
  onChangeTiktok: (v: string) => void;
  instagramUrl: string;
  onChangeInstagram: (v: string) => void;
}

export function SourceLinkInput({
  sourceUrl, onChangeSource,
  tiktokUrl, onChangeTiktok,
  instagramUrl, onChangeInstagram,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const handlePaste = (text: string) => {
    const type = detectType(text);
    if (type === "tiktok") { onChangeTiktok(text); onChangeSource(""); onChangeInstagram(""); }
    else if (type === "instagram") { onChangeInstagram(text); onChangeSource(""); onChangeTiktok(""); }
    else if (type === "web") { onChangeSource(text); onChangeTiktok(""); onChangeInstagram(""); }
    else { onChangeSource(text); }
  };

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardContent className="p-4">
        <Text className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3 ml-1">
          Source link (optional)
        </Text>

        <View className="flex-row items-center bg-white border border-[#282B4A]/5 rounded-2xl px-4 py-1 shadow-sm">
          <View className="mr-3">
            {!sourceUrl && !tiktokUrl && !instagramUrl && <Link size={18} color="rgba(40,43,74,0.3)" />}
            {sourceUrl && <Globe size={18} color="rgba(40,43,74,0.6)" />}
            {tiktokUrl && <Video size={18} color="rgba(40,43,74,0.6)" />}
            {instagramUrl && <Instagram size={18} color="#e1306c" />}
          </View>
          <Input
            value={tiktokUrl || instagramUrl || sourceUrl}
            onChangeText={handlePaste}
            placeholder="Paste a link..."
            placeholderTextColor="rgba(40,43,74,0.3)"
            autoCapitalize="none"
            keyboardType="url"
            className="flex-1 text-[#282B4A] font-medium text-base h-12 border-0 bg-transparent shadow-none px-0"
          />
        </View>

        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          className="mt-4 flex-row items-center justify-between px-2"
        >
          <Text className="text-[11px] text-primary font-bold uppercase tracking-widest">
            {expanded ? "Hide individual links" : "Add multiple links"}
          </Text>
          {expanded ? <ChevronUp size={14} color="rgba(40,43,74,0.4)" /> : <ChevronDown size={14} color="rgba(40,43,74,0.4)" />}
        </TouchableOpacity>

        {expanded && (
          <View className="mt-4 gap-4 px-1">
            <View className="gap-2">
              <Text className="text-[10px] uppercase font-bold text-[#282B4A]/30 ml-1 tracking-widest">Website URL</Text>
              <View className="flex-row items-center bg-white border border-[#282B4A]/5 rounded-xl px-3 py-1">
                <Globe size={14} color="rgba(40,43,74,0.3)" className="mr-2" />
                <Input value={sourceUrl} onChangeText={onChangeSource} placeholder="https://..." placeholderTextColor="rgba(40,43,74,0.2)" className="flex-1 text-sm h-10 border-none bg-transparent shadow-none px-0 font-sans" />
              </View>
            </View>
            <View className="gap-2">
              <Text className="text-[10px] uppercase font-bold text-[#282B4A]/30 ml-1 tracking-widest">TikTok URL</Text>
              <View className="flex-row items-center bg-white border border-[#282B4A]/5 rounded-xl px-3 py-1">
                <Video size={14} color="rgba(40,43,74,0.3)" className="mr-2" />
                <Input value={tiktokUrl} onChangeText={onChangeTiktok} placeholder="https://tiktok.com/..." placeholderTextColor="rgba(40,43,74,0.2)" className="flex-1 text-sm h-10 border-none bg-transparent shadow-none px-0 font-sans" />
              </View>
            </View>
            <View className="gap-2">
              <Text className="text-[10px] uppercase font-bold text-[#282B4A]/30 ml-1 tracking-widest">Instagram URL</Text>
              <View className="flex-row items-center bg-white border border-[#282B4A]/5 rounded-xl px-3 py-1">
                <Instagram size={14} color="rgba(40,43,74,0.3)" className="mr-2" />
                <Input value={instagramUrl} onChangeText={onChangeInstagram} placeholder="https://instagram.com/..." placeholderTextColor="rgba(40,43,74,0.2)" className="flex-1 text-sm h-10 border-none bg-transparent shadow-none px-0 font-sans" />
              </View>
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

