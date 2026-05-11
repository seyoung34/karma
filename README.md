# Karma

Karma는 로컬 Obsidian Vault와 Markdown 문서를 읽기 좋은 데스크탑 UI로 탐색하기 위한 개인용 작업 앱입니다.

웹 서비스가 아니라 내 컴퓨터에서 실행되는 Electron 앱이며, 로컬 폴더를 열고 파일/폴더를 빠르게 이동하면서 문서를 읽는 흐름에 집중합니다.

## 주요 기능

- 로컬 폴더를 워크스페이스로 추가
- Markdown 문서 읽기 전용 미리보기
- 첫 번째 줄의 `# 제목`을 문서 제목으로 사용
- 좌측 워크스페이스 레일
- 사이드바 파일/폴더 탐색
- 폴더/파일 탭 열기
- 커맨드 팔레트
- 문서 폭 설정
- 숨김 항목 표시 토글
- 폴더/파일 강조 색상
- 폴더별 독립 정렬
- 키보드 중심 탐색

## 기술 스택

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- Marked
- Lucide React

## 요구 사항

- Node.js 20 이상 권장
- npm
- Windows 환경에서 우선 개발 중

## 설치

```bash
git clone https://github.com/seyoung34/karma.git
cd karma
npm install
```

## 개발 실행

```bash
npm run dev
```

개발 모드는 Vite 개발 서버와 Electron을 함께 실행합니다.

## 타입 검사

```bash
npm run typecheck
```

## 빌드

```bash
npm run build
```

현재 `build` 명령은 Electron main/preload와 Vite renderer를 빌드합니다.

생성되는 주요 폴더:

- `dist/`
- `dist-electron/`

## 현재 배포 상태

아직 Windows 설치 파일 생성 설정은 포함되어 있지 않습니다.

GitHub Releases에 `.exe` 또는 `.msi` 설치 파일을 올리려면 다음 단계가 추가로 필요합니다.

1. `electron-builder` 또는 `electron-forge` 도입
2. 앱 아이콘, 앱 ID, artifact 이름 설정
3. Windows installer 빌드 스크립트 추가
4. GitHub Actions로 릴리스 자동 빌드 구성
5. GitHub Releases에 설치 파일 업로드

추천 방향은 `electron-builder`입니다. Karma처럼 개인용 Windows 데스크탑 앱을 먼저 배포하려는 경우 설정이 단순하고 GitHub Releases와 연결하기 쉽습니다.

## 기본 사용 흐름

1. 앱 실행
2. 좌측 워크스페이스 레일의 `+` 버튼으로 Root 폴더 추가
3. 사이드바에서 폴더 또는 파일 선택
4. 중앙 화면에서 문서 읽기
5. `Ctrl+K`로 커맨드 팔레트 열기
6. 검색 후 `Enter`로 현재 탭에서 열기
7. `Ctrl+Enter`로 새 탭에서 열기

## 주요 단축키

| 단축키 | 기능 |
| --- | --- |
| `Ctrl+K` | 커맨드 팔레트 열기 |
| `Ctrl+P` | 중앙 화면으로 포커스 이동 |
| `Ctrl+W` | 현재 탭 닫기 |
| `Ctrl+,` | 이전 탭 |
| `Ctrl+.` | 다음 탭 |
| `Alt+Left` | 뒤로 |
| `Alt+Right` | 앞으로 |
| `Ctrl+B` | 사이드바 열기/닫기 |
| `Ctrl+Shift+B` | 우측 패널 열기/닫기 |

## 키보드 탐색

### 워크스페이스 레일

- `ArrowUp`, `ArrowDown`: 항목 이동
- `ArrowRight`: 선택 항목 열기
- `Ctrl+ArrowRight`: 즐겨찾기 폴더를 새 탭으로 열기

### 사이드바

- `ArrowUp`, `ArrowDown`: 파일/폴더 포커스 이동
- `Enter`: 폴더 토글 또는 파일 열기
- `ArrowRight`: 폴더 열기 또는 파일 열기
- `Ctrl+ArrowRight`: 새 탭에서 열기
- `ArrowLeft`: 폴더 닫기 또는 상위 폴더로 이동

### 영역 이동

- `Shift+ArrowLeft`, `Shift+ArrowRight`: 워크스페이스 레일, 사이드바, 중앙 화면 사이 이동

## 설정 저장 위치

Electron의 `userData` 경로에 `settings.json`으로 저장됩니다.

Windows 기본 위치 예:

```text
C:\Users\<사용자명>\AppData\Roaming\Karma\settings.json
```

이 파일에는 워크스페이스 목록, 단축키, 문서 폭, 숨김 항목, 강조 색상 같은 사용자 설정이 저장됩니다.

## 프로젝트 구조

```text
Karma/
  electron/
    main.ts
    preload.ts
    types.ts
  src/
    components/
    lib/
    App.tsx
    main.tsx
    styles.css
    types.ts
  assets/
  package.json
  vite.config.ts
```

## 개발 메모

- 기존 UI는 일반 CSS와 CSS 변수 기반으로 작성되어 있습니다.
- 새로 추가하는 UI는 가능한 Tailwind CSS를 우선 사용합니다.
- 복잡한 상태 스타일, Electron window chrome, 세밀한 hover/active 조합은 일반 CSS를 함께 사용할 수 있습니다.
- 색상은 Tailwind 기본 팔레트보다 Karma의 CSS 변수 토큰을 우선 사용합니다.

사용 가능한 Tailwind 토큰 예:

- `bg-bg`
- `bg-surface`
- `bg-surface-2`
- `bg-chrome`
- `text-text`
- `text-muted`
- `text-accent`
- `border-line`
- `border-line-soft`

## 향후 계획

- 문서 본문 검색 인덱스
- 커맨드 팔레트 action 확장
- AI 실행 패널
- Markdown 결과 저장
- GitHub Releases용 설치 파일 생성
- GitHub Actions 배포 자동화

