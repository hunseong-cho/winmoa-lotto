// 단건 조회
const data = snap.data();
const maskedUser = "guest"; // ✅ 고정
return res.status(200).json({
  ...data,
  id: snap.id,
  user: maskedUser,
  createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? "",
});

// 전체 조회
const history = snapshot.docs.map(doc => {
  const data = doc.data();
  const maskedUser = "guest"; // ✅ 고정

  return {
    ...data,
    id: doc.id,
    user: maskedUser,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt ?? "",
  };
});