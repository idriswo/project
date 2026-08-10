# ═══════════════════════════════════════════════════════════════════
#  TIM — фронтенд дар контейнер
#
#  Барои Google Cloud Run сохта шудааст, вале дар ҳар VPS-и Docker-дор
#  ҳамон тавр кор мекунад.
#
#  МУҲИМ дар бораи `NEXT_PUBLIC_*`. Ин тағйирёбандаҳо ҳангоми **сохтан**
#  ба дохили кодҳои JavaScript дӯхта мешаванд, на ҳангоми оғоз хонда
#  мешаванд. Агар онҳоро танҳо дар танзимоти Cloud Run гузоред, браузер
#  ҷои холӣ мегирад ва барнома ба сервер муроҷиат карда наметавонад.
#  Аз ин рӯ онҳо `ARG`-анд ва ҳангоми `docker build` дода мешаванд:
#
#    docker build \
#      --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
#      --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
#      --build-arg NEXT_PUBLIC_API_URL=https://api.domeni-shumo.tj/api/v1 \
#      -t tim-web .
#
#  `SUPABASE_SERVICE_ROLE_KEY` ин ҷо ҲЕҶ ГОҲ намеояд — вай калиди пурраи
#  базаро медиҳад ва ҷояш танҳо дар бекенд аст.
# ═══════════════════════════════════════════════════════════════════

# ═══ Марҳилаи 1 — вобастагиҳо ═══════════════════════════════════════
FROM node:24-alpine AS deps

WORKDIR /app

# Аввал танҳо файлҳои пакетҳо — то кэши Docker ҳангоми тағйири код
# аз нав насб накунад
COPY package*.json ./
RUN npm ci


# ═══ Марҳилаи 2 — сохтан ════════════════════════════════════════════
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Телеметрияи Next дар сохтани контейнер чизе намедиҳад, вале вақт мегирад
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ═══ Марҳилаи 3 — иҷро ══════════════════════════════════════════════
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# `output: "standalone"` дар `next.config.ts` сервери тайёрро бо ҳамон
# модулҳое мегузорад, ки воқеан лозиманд. Се нусхаи алоҳида, зеро Next
# файлҳои статикӣ ва `public`-ро ба standalone намегузорад.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Ҳеҷ гоҳ аз номи root кор накун
USER node

# Cloud Run портро худаш дар `PORT` медиҳад; 8080 танҳо қимати пешфарз аст.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
EXPOSE 8080

CMD ["node", "server.js"]
