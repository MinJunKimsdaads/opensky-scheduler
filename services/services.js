import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
import { TOKEN_URL, AIRCRAFT_ALL_URL } from "../constant/apiConstant.js";

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
  return (await response.json()).access_token;
};

const getAllAircraftList = async () => {
  const token = await getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(AIRCRAFT_ALL_URL, { headers });
  if (!response.ok) throw new Error(`Aircraft list request failed: ${response.status}`);
  return await response.json();
};

export const saveJsonAndManage = async () => {
  const data = await getAllAircraftList();
  const time = data.time;
  if (!time) throw new Error("time 값 없음");

  const dataDir = "./data";
  fs.mkdirSync(dataDir, { recursive: true });

  const filename = `${time}.json`;
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

  // 오래된 파일 100개 초과 시 삭제
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort();
  if (files.length > 100) {
    const deleteCount = files.length - 100;
    for (let i = 0; i < deleteCount; i++) {
      fs.unlinkSync(path.join(dataDir, files[i]));
    }
  }

  console.log(`✅ 데이터 저장 완료: ${filename}`);
};