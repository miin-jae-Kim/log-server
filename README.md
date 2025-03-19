# Log Server with Batch Processing

이 프로젝트는 로그 데이터를 배치 처리하는 서버입니다. 메모리 내 큐를 사용하여 데이터를 수집하고, 주기적으로 MongoDB에 일괄 저장하는 방식으로 동작합니다.

## 시스템 구조

### 1. 데이터 흐름
```
[Client Request] → [NestJS Server] → [Memory Queue] → [MongoDB]
                                      ↓
                                [Redis Backup]
```

### 2. 주요 컴포넌트
- **NestJS Server**: API 요청을 처리하고 메모리 큐에 데이터를 추가
- **Memory Queue**: 데이터를 임시 저장하는 메모리 내 큐
- **Redis**: 서버 종료 시 큐 데이터를 백업
- **MongoDB**: 최종 데이터 저장소

### 3. 배치 처리 메커니즘
- **배치 크기**: 최대 1000개 항목
- **처리 주기**: 5초마다 실행
- **처리 방식**: BulkWrite를 사용하여 일괄 저장

## 작동 원리

### 1. 데이터 수집
```typescript
// 클라이언트 요청 → 메모리 큐
async addToQueue(data: any) {
  this.queue.push({
    message: 'Job processed',
    data,
    timestamp: new Date(),
  });
}
```

### 2. 배치 처리
```typescript
// 메모리 큐 → MongoDB
private async processBatch() {
  const batchSize = Math.min(this.BATCH_SIZE, this.queue.length);
  const batch = this.queue.splice(0, batchSize);
  
  const operations = batch.map(item => ({
    insertOne: {
      document: item,
      onDuplicateKeyUpdate: true,
    },
  }));

  await this.logModel.bulkWrite(operations);
}
```

### 3. 데이터 복구
```typescript
// 서버 시작 시 Redis에서 데이터 복구
async onModuleInit() {
  const savedData = await this.redis.get(this.REDIS_KEY);
  if (savedData) {
    this.queue = JSON.parse(savedData);
    await this.redis.del(this.REDIS_KEY);
  }
}
```

### 4. 안전한 종료
```typescript
// 서버 종료 시 Redis에 데이터 백업
private async handleShutdown() {
  if (this.queue.length > 0) {
    await this.redis.set(this.REDIS_KEY, JSON.stringify(this.queue));
  }
  await this.redis.quit();
}
```

## API 엔드포인트

### 1. Job 추가
```bash
POST /add-job
Content-Type: application/json

{
  "message": "Test job"
}
```

### 2. 로그 조회
```bash
GET /logs
```

### 3. 큐 크기 확인
```bash
GET /queue-size
```

## 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. Docker 서비스 시작
```bash
docker compose up -d
```

### 3. 서버 실행
```bash
npm run start:dev
```

## 시스템 요구사항
- Node.js
- Docker & Docker Compose
- Redis
- MongoDB

## 주의사항
1. 서버 종료 시 반드시 Ctrl+C를 사용하여 정상 종료
2. 비정상 종료 시 Redis에 백업된 데이터가 있을 수 있음
3. 서버 재시작 시 자동으로 백업된 데이터 복구

## 에러 처리
- 배치 처리 실패 시 해당 항목들을 다시 큐에 추가
- Redis 연결 실패 시 로그 출력
- MongoDB 연결 실패 시 로그 출력