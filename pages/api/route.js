import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.resolve(process.cwd(), 'public', 'lottoHistory.json');

// ✅ GET - 저장된 히스토리 가져오기
export async function GET() {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return new Response(data, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify([]), { status: 200 });
  }
}

// ✅ POST - 새로운 로또 기록 추가
export async function POST(req) {
  try {
    const newEntry = await req.json();
    let existingData = [];

    try {
      const data = await fs.readFile(filePath, 'utf8');
      existingData = JSON.parse(data);
    } catch (error) {
      existingData = [];
    }

    existingData.unshift(newEntry);
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));

    return new Response(JSON.stringify(existingData), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Error saving data' }), { status: 500 });
  }
}

// ✅ DELETE - 특정 회차(round) 기록 삭제
export async function DELETE(req) {
  try {
    const { round } = await req.json();

    if (!round) {
      return new Response(JSON.stringify({ message: '회차 정보 누락됨' }), { status: 400 });
    }

    const data = await fs.readFile(filePath, 'utf8');
    const existingData = JSON.parse(data);
    const filteredData = existingData.filter(entry => entry.round !== round);

    await fs.writeFile(filePath, JSON.stringify(filteredData, null, 2));

    return new Response(JSON.stringify(filteredData), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: '삭제 실패' }), { status: 500 });
  }
}
