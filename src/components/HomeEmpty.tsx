import { FolderOpen } from "lucide-react";

export function HomeEmpty({ onOpenFolder }: { onOpenFolder: () => void }) {
  return (
    <section className="home-empty">
      <div>
        <p>홈</p>
        <h1>작업할 Vault를 열어주세요.</h1>
        <span>나중에 오늘의 TODO, 서비스 대시보드, 최근 작업을 이 영역에 배치합니다.</span>
      </div>
      <button onClick={onOpenFolder}><FolderOpen size={17} />폴더 열기</button>
    </section>
  );
}
