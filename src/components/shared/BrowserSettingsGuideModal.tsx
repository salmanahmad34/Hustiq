import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Info, ArrowRight, ShieldAlert } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'

interface BrowserSettingsGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

type BrowserType = 'chrome' | 'safari' | 'firefox' | 'edge'

export const BrowserSettingsGuideModal: React.FC<BrowserSettingsGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<BrowserType>('chrome')
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    useUiStore.getState().addToast('Settings link copied to clipboard!', 'success')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const browserGuides = {
    chrome: {
      name: 'Google Chrome',
      link: 'chrome://settings/content/notifications',
      steps: [
        'Click the **Tune/Lock icon** (🔒 or 🎛️) located on the left side of the address bar at the top.',
        'Locate the **Notifications** option in the dropdown list.',
        'Toggle the setting to **Allow**.',
        'If you do not see it, click **Site Settings**, find **Notifications** under Permissions, and choose **Allow**.',
        'Alternatively, copy and paste this link in a new tab: `chrome://settings/content/notifications`'
      ]
    },
    safari: {
      name: 'Apple Safari',
      link: 'Safari > Settings > Websites > Notifications',
      steps: [
        'Open **Safari** from the top macOS menu bar.',
        'Click **Settings** (or *Preferences*) and navigate to the **Websites** tab.',
        'Click **Notifications** from the left-hand sidebar.',
        'Find **HustiQ** (or your current URL) in the list of websites.',
        'Change the dropdown permission status on the right to **Allow**.'
      ]
    },
    firefox: {
      name: 'Mozilla Firefox',
      link: 'about:preferences#privacy',
      steps: [
        'Click the **Lock icon** (🔒) to the left of the website URL in the address bar.',
        'Click the **Connection Secure** arrow, then click **More Information**.',
        'Go to the **Permissions** tab.',
        'Scroll down to **Send Notifications** and uncheck "Use Default".',
        'Select **Allow**.'
      ]
    },
    edge: {
      name: 'Microsoft Edge',
      link: 'edge://settings/content/notifications',
      steps: [
        'Click the **Lock icon** (🔒) on the left side of the address bar at the top.',
        'Click **Permissions for this site**.',
        'Find **Notifications** in the list.',
        'Set the dropdown menu selection to **Allow**.',
        'Alternatively, copy and paste this link in a new tab: `edge://settings/content/notifications`'
      ]
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative w-full max-w-xl bg-card border border-border/60 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-left z-10"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight">Enable Blocked Notifications</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Quick guide to restore notification permission</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Browser Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-muted/20 border border-border/30 rounded-2xl my-5">
              {(Object.keys(browserGuides) as BrowserType[]).map((browser) => (
                <button
                  key={browser}
                  onClick={() => setActiveTab(browser)}
                  className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-center ${
                    activeTab === browser
                      ? 'bg-card text-foreground shadow-sm border border-border/40'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {browser}
                </button>
              ))}
            </div>

            {/* Instruction Body */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <span>Instructions for</span>
                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                  {browserGuides[activeTab].name}
                </span>
              </div>

              {/* Steps List */}
              <ul className="space-y-3.5 mt-2">
                {browserGuides[activeTab].steps.map((step, idx) => {
                  // Replace simple markdown bold `**text**` with bold elements
                  const parts = step.split('**')
                  return (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-black shrink-0 text-foreground border border-border/40 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>
                        {parts.map((part, i) => (
                          i % 2 === 1 ? <strong key={i} className="font-extrabold text-foreground">{part}</strong> : part
                        ))}
                      </span>
                    </li>
                  )
                })}
              </ul>

              {/* Browser Configuration Path Copy Bar */}
              {browserGuides[activeTab].link.includes('://') && (
                <div className="mt-6 p-4 bg-muted/30 border border-border/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">
                      Direct Configuration Link
                    </h5>
                    <p className="text-xs font-mono text-foreground truncate select-all">
                      {browserGuides[activeTab].link}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyLink(browserGuides[activeTab].link)}
                    className="shrink-0 flex items-center justify-center gap-2 bg-card border border-border hover:bg-muted/50 text-foreground py-2 px-4 rounded-xl text-xs font-bold transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              )}

              {/* Notice Tip */}
              <div className="mt-6 p-4 bg-primary/[0.02] border border-primary/10 rounded-2xl flex items-start gap-3">
                <Info className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  After setting permission to <strong>Allow</strong>, return here and reload the application. The system will automatically detect the updated permission state.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border/30 pt-4 mt-6">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-foreground text-background font-black rounded-xl hover:shadow-lg active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
              >
                <span>Got it</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
