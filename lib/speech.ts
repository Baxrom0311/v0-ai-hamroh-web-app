"use client"

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

export function speakText(text: string, language: "uz" | "ru" | "en" = "uz") {
  if (!canSpeak()) {
    return false
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ"
  utterance.rate = 0.9
  utterance.pitch = 1

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.toLowerCase()))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(language))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("tr"))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("ru"))
  if (preferred) utterance.voice = preferred

  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
