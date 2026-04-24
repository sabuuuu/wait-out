import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Link, Clipboard, ChevronDown, ChevronUp, Globe, Video, Instagram } from "lucide-react-native";

function detectType(url: string): "tiktok" | "instagram" | "web" | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("tiktok.com") || lower.includes("vm.tiktok")) return "tiktok";
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) return "instagram";
  return "web";
}

interface Props {
  sourceUrl:         string;
  onChangeSource:    (v: string) => void;
  tiktokUrl:         string;
  onChangeTiktok:    (v: string) => void;
  instagramUrl:      string;
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
    if (type === "tiktok")    { onChangeTiktok(text);    onChangeSource(""); onChangeInstagram(""); }
    else if (type === "instagram") { onChangeInstagram(text); onChangeSource(""); onChangeTiktok(""); }
    else if (type === "web")       { onChangeSource(text);    onChangeTiktok(""); onChangeInstagram(""); }
    else { onChangeSource(text); }
  };

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardContent className="p-4">
        <Text className="text-xs text-blue-300 font-semibold mb-3 uppercase tracking-wide">
          Source link (optional)
        </Text>

        <View className="flex-row items-center bg-muted rounded-xl px-3 py-1">
          <View className="mr-2">
            {!sourceUrl && !tiktokUrl && !instagramUrl && <Link size={18} className="text-muted-foreground" />}
            {sourceUrl && <Globe size={18} className="text-primary" />}
            {tiktokUrl && <Video size={18} className="text-foreground" />}
            {instagramUrl && <Instagram size={18} className="text-pink-500" />}
          </View>
          <TextInput
            value={tiktokUrl || instagramUrl || sourceUrl}
            onChangeText={handlePaste}
            placeholder="Paste a link..."
            placeholderTextColor="#c4a0ab"
            autoCapitalize="none"
            keyboardType="url"
            className="flex-1 text-foreground font-medium text-base h-10"
          />
        </View>

        <TouchableOpacity 
          onPress={() => setExpanded(!expanded)} 
          className="mt-3 flex-row items-center justify-between"
        >
          <Text className="text-xs text-primary font-bold">
            {expanded ? "Hide individual links" : "Add multiple links"}
          </Text>
          {expanded ? <ChevronUp size={14} color="#EEEBDA" /> : <ChevronDown size={14} color="#EEEBDA" />}
        </TouchableOpacity>

        {expanded && (
          <View className="mt-4 gap-4">
            <View className="gap-1">
              <Text className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Website URL</Text>
              <View className="flex-row items-center bg-muted rounded-xl px-3 py-1">
                <Globe size={14} className="text-muted-foreground mr-2" />
                <TextInput value={sourceUrl} onChangeText={onChangeSource} placeholder="https://..." placeholderTextColor="#c4a0ab" className="flex-1 text-sm h-8" />
              </View>
            </View>
            <View className="gap-1">
              <Text className="text-[10px] uppercase font-bold text-muted-foreground ml-1">TikTok URL</Text>
              <View className="flex-row items-center bg-muted rounded-xl px-3 py-1">
                <Video size={14} className="text-muted-foreground mr-2" />
                <TextInput value={tiktokUrl} onChangeText={onChangeTiktok} placeholder="https://tiktok.com/..." placeholderTextColor="#c4a0ab" className="flex-1 text-sm h-8" />
              </View>
            </View>
            <View className="gap-1">
              <Text className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Instagram URL</Text>
              <View className="flex-row items-center bg-muted rounded-xl px-3 py-1">
                <Instagram size={14} className="text-muted-foreground mr-2" />
                <TextInput value={instagramUrl} onChangeText={onChangeInstagram} placeholder="https://instagram.com/..." placeholderTextColor="#c4a0ab" className="flex-1 text-sm h-8" />
              </View>
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
