import { PanelRightClose } from "lucide-react";
import { IconButton } from "./IconButton";

export function RightPanel({ status, onClose }: { status: string; onClose: () => void }) {
  return (
    <aside className="right-panel">
      <div className="panel-title">
        <h2>작업 패널</h2>
        <IconButton title="우측 패널 닫기" onClick={onClose}>
          <PanelRightClose size={16} />
        </IconButton>
      </div>
      <div className="panel-section">
        <button disabled>문서 요약</button>
        <button disabled>분류하기</button>
        <button disabled>다음 액션</button>
        <button disabled>Markdown 저장</button>
      </div>
      <div className="panel-section">
        <h2>실행 로그</h2>
        <div className="log-line">read-only mode</div>
        <div className="log-line">{status}</div>
        <div className="log-line">AI CLI 연결은 다음 단계</div>
      </div>
    </aside>
  );
}
