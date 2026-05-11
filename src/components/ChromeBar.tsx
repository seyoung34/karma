import {
  ArrowLeft,
  ArrowRight,
  Copy,
  FileText,
  Folder,
  FolderOpen,
  Home,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Search,
  Settings,
  Star,
  X
} from "lucide-react";
import type { AppSettings, Tab } from "../types";
import { IconButton } from "./IconButton";

export function ChromeBar({
  settings,
  tabs,
  activeTab,
  activeTabId,
  onOpenFolder,
  onOpenSettings,
  onToggleSidebar,
  onToggleRightPanel,
  onBack,
  onForward,
  onNewTab,
  onSelectTab,
  onCloseTab,
  onWindowClose
}: {
  settings: AppSettings;
  tabs: Tab[];
  activeTab?: Tab;
  activeTabId: string;
  onOpenFolder: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  onToggleRightPanel: () => void;
  onBack: () => void;
  onForward: () => void;
  onNewTab: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onWindowClose: () => void;
}) {
  return (
    <header className="chrome-bar">
      <nav className="rail">
        <IconButton title="홈"><Home size={17} /></IconButton>
        <IconButton title="폴더 열기" onClick={onOpenFolder}><FolderOpen size={17} /></IconButton>
        <IconButton title="검색"><Search size={17} /></IconButton>
        <IconButton title="즐겨찾기"><Star size={17} /></IconButton>
        <IconButton title="설정" onClick={onOpenSettings}><Settings size={17} /></IconButton>
      </nav>

      <div className="chrome-main">
        <div className="chrome-actions">
          <IconButton title={settings.sidebarCollapsed ? "좌측 패널 열기" : "좌측 패널 닫기"} onClick={onToggleSidebar}>
            {settings.sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </IconButton>
          <IconButton title="뒤로" onClick={onBack} disabled={!activeTab || activeTab.historyIndex === 0}>
            <ArrowLeft size={16} />
          </IconButton>
          <IconButton title="앞으로" onClick={onForward} disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}>
            <ArrowRight size={16} />
          </IconButton>
        </div>

        <div className="tabs title-drag">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${tab.id === activeTabId ? "active" : ""}`}
              title={tab.title}
              onClick={() => onSelectTab(tab.id)}
            >
              {tab.folder ? <Folder size={14} /> : <FileText size={14} />}
              <span>{tab.title}</span>
              <X size={14} onClick={(event) => { event.stopPropagation(); onCloseTab(tab.id); }} />
            </button>
          ))}
          <button className="new-tab" title="새 탭" onClick={onNewTab}><Plus size={16} /></button>
        </div>

        <div className="window-tools">
          <IconButton title={settings.rightPanelCollapsed ? "우측 패널 열기" : "우측 패널 닫기"} onClick={onToggleRightPanel}>
            {settings.rightPanelCollapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}
          </IconButton>
          <IconButton title="최소화" onClick={() => void window.karma.windowMinimize()}><Minus size={17} /></IconButton>
          <IconButton title="최대화/복구" onClick={() => void window.karma.windowMaximize()}><Copy size={15} /></IconButton>
          <IconButton title="닫기" onClick={onWindowClose}><X size={17} /></IconButton>
        </div>
      </div>
    </header>
  );
}
