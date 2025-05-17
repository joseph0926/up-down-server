# Up & Down Server

<p align="center">
  <img src="assets/logo.webp" alt="Up & Down logo" width="180" />
</p>

실시간 찬반 토론 플랫폼 **“Up & Down”** 의 서버 코드 베이스입니다.

---

## 목차

1. [주요 기능](#주요-기능)
2. [기술 스택](#기술-스택)
3. [로컬 실행](#로컬-실행)
4. [스크립트](#스크립트)
5. [디렉터리 구조](#디렉터리-구조)
6. [환경 변수](#환경-변수)
7. [API 문서](#api-문서)
8. [테스트](#테스트)
9. [라이선스](#라이선스)

---

## 주요 기능 <a id="주요-기능"></a>

| 구분              | 설명                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| 🏎 **Fastify v5** | 초고속 JSON HTTP 서버 (17 K req/sec+)                                |
| 🔐 보안 플러그인  | `@fastify/helmet`, `@fastify/csrf-protection`, `@fastify/rate-limit` |
| 📜 스키마 검증    | `zod` 기반 DTO 검증 & 자동 Swagger Docs                              |
| 🗄 Prisma ORM     | PostgreSQL(예정) – Prisma 6                                          |
| 📈 로깅           | `pino`, `pino-pretty`, Loki Grafana exporter                         |

---

## 기술 스택 <a id="기술-스택"></a>

| 범주           | 라이브러리                                                       |
| -------------- | ---------------------------------------------------------------- |
| **Runtime**    | Node 22 (ES Modules)                                             |
| **Server**     | Fastify 5, `@fastify/*` 플러그인                                 |
| **ORM**        | Prisma 6 (`@prisma/client`)                                      |
| **Validation** | Zod                                                              |
| **Config**     | `envalid`                                                        |
| **Testing**    | Vitest + `@vitest/coverage-v8`                                   |
| **Dev Tools**  | TypeScript 5, Tsx (HMR), ESLint 9 + Prettier, Husky (pre-commit) |

---

## 로컬 실행 <a id="로컬-실행"></a>

```bash
# 1. 의존성 설치
pnpm i

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일 수정 (PORT, DATABASE_URL 등)

# 3. 개발 모드 (ts-node + HMR)
pnpm dev

# 4. Swagger 문서
# -> http://localhost:4000/docs
```

> 기본 포트 **4000**

---

## 스크립트 <a id="스크립트"></a>

| 명령어           | 목적                                     |
| ---------------- | ---------------------------------------- |
| `pnpm dev`       | HMR(Hot-Reload) 개발 서버 (`tsx watch`)  |
| `pnpm build`     | TypeScript → ESBuild 컴파일 (`dist/`)    |
| `pnpm start`     | 빌드 산출물 실행 (`node dist/server.js`) |
| `pnpm test`      | Vitest 단위 테스트                       |
| `pnpm lint`      | ESLint (fix 포함)                        |
| `pnpm format`    | Prettier 코드 포맷팅                     |
| `pnpm typecheck` | 엄격 TypeScript 검사(emit X)             |

---

## 디렉터리 구조 <a id="디렉터리-구조"></a>

```
up-down-server/
├─ prisma/
│  └─ schema.prisma     # DB 스키마
├─ src/
│  ├─ plugins/          # Fastify 플러그인 등록
│  ├─ routes/           # REST 엔드포인트
│  ├─ lib/              # 공통 유틸리티 (logger, env 등)
│  └─ server.ts         # 부트스트랩
└─ vitest.config.ts
```

---

## 환경 변수 <a id="환경-변수"></a>

`.env`

```env
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=

# Rate-Limit
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
```

환경 값은 `envalid` 로 런타임 검증되며, 누락 시 애플리케이션이 즉시 종료됩니다.

---

## API 문서 <a id="api-문서"></a>

- **Swagger UI** : `GET /docs`
- **OpenAPI JSON** : `GET /docs/json`

> 스키마는 각 라우트의 Zod schema 로부터 자동 생성됩니다.

---

## 테스트 <a id="테스트"></a>

```bash
pnpm test           # CI용 (커버리지 포함)
pnpm test --watch   # 개발용 Watch
```

커버리지는 **V8** 리포터(`coverage/`)로 산출됩니다.

---

## 라이선스 <a id="라이선스"></a>

본 프로젝트는 MIT 라이선스로 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.
