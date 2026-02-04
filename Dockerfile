FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5555

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN chown -R node:node /app
USER node

EXPOSE 5555

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
     CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5555) + '/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "server.js"]
