# Karma

Karma는 로컬 폴더와 Markdown 문서를 빠르게 탐색하고 읽기 위한 개인용 데스크탑 앱입니다.

Obsidian Vault처럼 Markdown 파일이 많은 폴더를 열어두고, 파일명 대신 문서 안의 첫 번째 `# 제목`을 중심으로 더 편하게 문서를 확인하는 데 집중합니다.

## 다운로드 및 설치

Windows 사용자는 GitHub Releases에서 설치 파일을 다운로드할 수 있습니다.

1. [Karma Releases](https://github.com/seyoung34/karma/releases) 페이지로 이동합니다.
2. 최신 버전의 `Karma Setup 0.1.0.exe` 파일을 다운로드합니다.
3. 다운로드한 Setup 파일을 실행합니다.
4. 설치가 끝나면 Karma를 실행합니다.

> Windows SmartScreen 경고가 표시될 수 있습니다. 현재 Karma는 개인 프로젝트로 배포 중이며 코드 서명 인증서가 적용되어 있지 않습니다.

## 주요 기능

- 로컬 폴더를 워크스페이스로 추가
- Markdown 문서 읽기 전용 미리보기
- 문서 첫 번째 줄의 `# 제목`을 앱의 문서 제목으로 표시
- 좌측 워크스페이스 레일
- 사이드바 파일/폴더 탐색
- 파일과 폴더를 탭으로 열기
- 커맨드 팔레트로 빠른 이동
- 문서 폭 설정
- 파일/폴더 절대 경로 복사
- 숨김 항목 표시 토글
- 폴더/파일 강조 색상
- 폴더별 독립 정렬
- 키보드 중심 탐색

## 기본 사용 방법

1. Karma를 실행합니다.
2. 좌측 워크스페이스 레일의 `+` 버튼을 눌러 Root 폴더를 추가합니다.
3. 사이드바에서 폴더 또는 파일을 선택합니다.
4. 중앙 화면에서 Markdown 문서를 읽습니다.
5. `Ctrl+K`를 눌러 커맨드 팔레트를 열고 빠르게 이동합니다.

## 커맨드 팔레트

`Ctrl+K`를 누르면 커맨드 팔레트가 열립니다.

검색 가능한 항목:

- 현재 사이드바에 보이는 파일
- 현재 사이드바에 보이는 폴더
- 열린 탭
- 워크스페이스 Root 폴더
- 워크스페이스 레일 즐겨찾기 폴더

동작:

- `Enter`: 현재 탭에서 열기
- `Ctrl+Enter`: 새 탭에서 열기
- `ArrowUp`, `ArrowDown`: 결과 이동
- `Esc`: 닫기

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

## 문서 보기

문서 화면 우상단의 `...` 버튼에서 문서 폭을 변경할 수 있습니다.

선택 가능한 문서 폭:

- 좁게
- 기본
- 넓게
- 전체

문서 상단의 복사 버튼을 누르면 현재 파일의 절대 경로가 클립보드에 복사됩니다.

폴더 화면에서도 폴더의 절대 경로를 복사할 수 있습니다.

## 설정 저장 위치

Karma의 사용자 설정은 Electron의 `userData` 경로에 `settings.json`으로 저장됩니다.

Windows 기본 위치 예:

```text
C:\Users\<사용자명>\AppData\Roaming\Karma\settings.json
```

이 파일에는 워크스페이스 목록, 단축키, 문서 폭, 숨김 항목, 강조 색상 같은 사용자 설정이 저장됩니다.

## 직접 개발 실행

개발자가 직접 실행하려면 Node.js와 npm이 필요합니다.

```bash
git clone https://github.com/seyoung34/karma.git
cd karma
npm install
npm run dev
```

빌드 확인:

```bash
npm run typecheck
npm run build
```

