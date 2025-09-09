import fetch from "node-fetch";
import fs from 'fs';
import path from "path";
import {TOKEN_URL,AIRCRAFT_ALL_URL} from '../constant/apiConstant.js';
import dotenv from 'dotenv';

dotenv.config();

// OpenSky API 토큰 발급
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

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.access_token;
};

// OpenSky 전체 항공기 리스트
const getAllAircraftList = async () => {
  const token = await getAccessToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(AIRCRAFT_ALL_URL, { headers });
  if (!response.ok) {
    throw new Error(`Aircraft list request failed: ${response.status}`);
  }
  return await response.json();
};

const uploadToSFTP = async (localPath, filename) => {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: process.env.SFTP_HOST,
            user: process.env.SFTP_USERNAME,
            password: process.env.SFTP_PASSWORD,
            port: process.env.SFTP_PORT,
            secure: false, // FTPS가 아닌 경우 false
        });
        const remotePath = path.posix.join(process.env.SFTP_PATH, filename);
        await client.uploadFrom(localPath, remotePath);
        // console.log('FTP 업로드 성공');
        await client.cd(process.env.SFTP_PATH);
        const list = await client.list();
        if(list.length > 100){
            const files = list
            .sort((a, b) => {
                const aTime = parseInt(a.name.replace('.json.gz', ''));
                const bTime = parseInt(b.name.replace('.json.gz', ''));
                return bTime - aTime;
            });
            const filesToDelete = list.slice(100);
            for (const file of filesToDelete) {
                await client.remove(file.name);
            }
        }
    } catch(err){
        console.error(err);
    } finally{
        client.close();
    }
}

export const saveJsonAndManage = async () => {
  const data = await getAllAircraftList();
  const time = data.time;
  if (!time) throw new Error("time 값 없음");

  const filename = `${time}.json`;
  const dataDir = "./data";
  fs.mkdirSync(dataDir, { recursive: true });

  const filePath = path.resolve(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ 파일 저장: ${filePath}`);

  // 100개 이상이면 오래된 파일 삭제
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => parseInt(a) - parseInt(b)); // 오래된 순

  if (files.length > 100) {
    const deleteCount = files.length - 100;
    for (let i = 0; i < deleteCount; i++) {
      const delPath = path.resolve(dataDir, files[i]);
      fs.unlinkSync(delPath);
      console.log(`🗑️ 삭제: ${delPath}`);
    }
  }
};