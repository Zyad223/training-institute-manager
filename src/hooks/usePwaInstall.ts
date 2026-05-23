import { useCallback, useEffect, useState } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isStandalone() {
  const anyWindow = window as unknown as {
    matchMedia?: (query: string) => MediaQueryList
    navigator?: { standalone?: boolean }
  }
  return (
    anyWindow.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    anyWindow.navigator?.standalone === true
  )
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return isStandalone()
  })

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }

    function onAppInstalled() {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return false
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    if (choice.outcome === "accepted") setInstalled(true)
    return choice.outcome === "accepted"
  }, [deferred])

  return {
    canInstall: Boolean(deferred) && !installed,
    installed,
    promptInstall,
  }
}

