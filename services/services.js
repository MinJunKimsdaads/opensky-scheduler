import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
import { TOKEN_URL, AIRCRAFT_ALL_URL } from "../constant/apiConstant.js";
import { slimResponse } from "./slim.js";

// OpenSky's "state vector" rows carry 17–18 fields; the client only
// consumes 9 of them. Storing the full row pretty-printed is wasteful
// — every snapshot used to weigh ~1.9 MB on disk, ~329 KB gzip-wire.
// `slimResponse` (./slim.js) drops unused fields; removing the
// pretty-print here trims a further ~30%. The schema marker on the
// envelope lets the client tell new files from legacy fat ones.

// Opensky API 토큰 발급
const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.OPENSKY_CLIENT_ID);
  params.append("client_secret", process.env.OPENSKY_CLIENT_SECRET);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
  const data = await response.json();
  return data.access_token;
};

// 모든 항공기 리스트 가져오기
const getAllAircraftList = async () => {
  const token = await getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(AIRCRAFT_ALL_URL, { headers });
  if (!response.ok) throw new Error(`Aircraft list request failed: ${response.status}`);
  return await response.json();
};

// JSON 저장 (스키마 슬리밍 적용). 정리는 cleanup.yml 워크플로우가
// target-repo 전체를 대상으로 일일 수행하므로 여기서는 하지 않는다.
// (이전 버전에 있던 200개 cap 루프는 GH Actions 워크스페이스가
// 매번 비어있어 실질적으로 dead code였음.)
export const saveJsonAndManage = async () => {
  const data = await getAllAircraftList();
  const time = data.time;
  if (!time) throw new Error("time 값이 없습니다.");

  const dataDir = "./data/flight/";
  fs.mkdirSync(dataDir, { recursive: true });

  const slim = slimResponse(data);
  const filename = `${time}.json`;
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(slim), "utf-8");

  const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(
    `✅ 데이터 저장 완료: ${filename} (${slim.states.length} states, ${sizeKb} KB)`,
  );
};
