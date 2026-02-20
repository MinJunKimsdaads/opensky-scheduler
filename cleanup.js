import fs from "fs";
import path from "path";

const dataDir = process.env.DATA_DIR || "./data/flight/";
const MAX_FILES = 200;

const cleanupOldFiles = () => {
  if (!fs.existsSync(dataDir)) {
    console.log("데이터 디렉토리가 존재하지 않습니다.");
    return;
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .sort(); // 타임스탬프 오름차순 (오래된 것이 앞)

  console.log(`📁 전체 파일 수: ${files.length}`);

  if (files.length > MAX_FILES) {
    const deleteCount = files.length - MAX_FILES;
    const filesToDelete = files.slice(0, deleteCount);

    for (const file of filesToDelete) {
      fs.unlinkSync(path.join(dataDir, file));
      console.log(`🗑️  삭제: ${file}`);
    }

    console.log(`✅ 정리 완료: ${deleteCount}개 삭제, ${MAX_FILES}개 유지`);
  } else {
    console.log(`✅ 정리 불필요: 현재 ${files.length}개 (기준치: ${MAX_FILES}개)`);
  }
};

cleanupOldFiles();
