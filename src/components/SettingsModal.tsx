import type { ActionId, AppSettings } from "../types";
import { actionLabels } from "../lib/defaults";
import { IconButton } from "./IconButton";
import { X } from "lucide-react";

export function SettingsModal({
  settings,
  recordingAction,
  onRecord,
  onClose
}: {
  settings: AppSettings;
  recordingAction: ActionId | null;
  onRecord: (action: ActionId) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="settings-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>설정</p>
            <h2>단축키</h2>
          </div>
          <IconButton title="닫기" onClick={onClose}><X size={17} /></IconButton>
        </div>
        {(Object.keys(actionLabels) as ActionId[]).map((action) => (
          <div className="shortcut-row" key={action}>
            <span>{actionLabels[action]}</span>
            <button onClick={() => onRecord(action)}>
              {recordingAction === action ? "입력 대기" : settings.shortcuts[action]}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
