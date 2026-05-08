import * as Linking from "expo-linking";
import { router } from "expo-router";

function handleUrl(url: string | null) {
  if (!url) return;
  const parsed = Linking.parse(url);
  if (parsed.path === "add" || parsed.path === "add-item") {
    setTimeout(() => {
      router.push({
        pathname: "/(tabs)/add",
        params: {
          url: parsed.queryParams?.url as string,
          title: parsed.queryParams?.title as string,
        },
      });
    }, 100); // Slight delay for navigation readiness on cold boot
  }
}

export function setupShareHandler() {
  Linking.getInitialURL().then(handleUrl).catch(() => {});
  Linking.addEventListener("url", ({ url }) => handleUrl(url));
}
