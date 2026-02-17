import {
  db,
  doc,
  getDoc,
  runTransaction,
} from './firebase';

// 페어 생성 트랜잭션
// 코드 검증 → 커플 문서 생성 → 양쪽 유저 업데이트 (원자적)
export const createPair = async (myUid, inviteCode) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    // 초대 코드 정규화
    let normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode.startsWith('MALL-')) {
      normalizedCode = 'MALL-' + normalizedCode;
    }

    const result = await runTransaction(db, async (transaction) => {
      // 1. 초대 코드 검증
      const codeRef = doc(db, 'inviteCodes', normalizedCode);
      const codeSnap = await transaction.get(codeRef);

      if (!codeSnap.exists()) {
        throw new Error('초대 코드를 찾을 수 없어요. 코드를 다시 확인해주세요');
      }

      const codeData = codeSnap.data();
      if (!codeData.active) {
        throw new Error('이미 사용된 초대 코드입니다');
      }
      if (codeData.ownerUid === myUid) {
        throw new Error('자신의 초대 코드는 사용할 수 없습니다');
      }

      // 2. 상대방 유저 데이터 읽기
      const partnerUid = codeData.ownerUid;
      const partnerRef = doc(db, 'users', partnerUid);
      const partnerSnap = await transaction.get(partnerRef);

      if (!partnerSnap.exists()) {
        throw new Error('상대방 계정을 찾을 수 없습니다');
      }

      const partnerData = partnerSnap.data();
      if (partnerData.activeCoupleId) {
        throw new Error('상대방이 이미 다른 짝꿍과 연결되어 있습니다');
      }

      // 3. 내 유저 데이터 읽기
      const myRef = doc(db, 'users', myUid);
      const mySnap = await transaction.get(myRef);

      if (!mySnap.exists()) {
        throw new Error('내 계정을 찾을 수 없습니다');
      }

      const myData = mySnap.data();
      if (myData.activeCoupleId) {
        throw new Error('이미 다른 짝꿍과 연결되어 있습니다');
      }

      // 4. 커플 문서 생성
      const coupleId = `${myUid}_${partnerUid}_${Date.now()}`;
      const coupleRef = doc(db, 'couples', coupleId);
      const now = new Date().toISOString();

      const coupleData = {
        coupleId,
        members: [myUid, partnerUid],
        memberProfiles: {
          [myUid]: {
            displayName: myData.displayName || '',
            photoURL: myData.photoURL || null,
          },
          [partnerUid]: {
            displayName: partnerData.displayName || '',
            photoURL: partnerData.photoURL || null,
          },
        },
        status: 'active',
        sharedSurveys: {
          [myUid]: myData.survey || {},
          [partnerUid]: partnerData.survey || {},
        },
        sharedPreferences: {
          [myUid]: { likedWords: '', dislikedWords: '' },
          [partnerUid]: { likedWords: '', dislikedWords: '' },
        },
        previousCoupleId: null,
        createdAt: now,
        updatedAt: now,
        endedAt: null,
        version: 1,
      };

      transaction.set(coupleRef, coupleData);

      // 5. 양쪽 유저 업데이트
      const coupleHistoryEntry = {
        coupleId,
        partnerUid: partnerUid,
        startedAt: now,
        endedAt: null,
        status: 'active',
      };

      transaction.update(myRef, {
        activeCoupleId: coupleId,
        coupleHistory: [...(myData.coupleHistory || []), coupleHistoryEntry],
        updatedAt: now,
      });

      transaction.update(partnerRef, {
        activeCoupleId: coupleId,
        coupleHistory: [...(partnerData.coupleHistory || []), {
          ...coupleHistoryEntry,
          partnerUid: myUid,
        }],
        updatedAt: now,
      });

      // 6. 초대 코드 비활성화
      transaction.update(codeRef, {
        active: false,
        usedByUid: myUid,
        usedAt: now,
      });

      return { coupleId, coupleData, partnerData };
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('Create pair error:', error);
    return { data: null, error: error.message };
  }
};

// 페어 해제 트랜잭션
// 커플 status=ended → 양쪽 activeCoupleId=null → history 업데이트
export const dissolvePair = async (coupleId, myUid) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    await runTransaction(db, async (transaction) => {
      // 1. 커플 문서 읽기
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleSnap = await transaction.get(coupleRef);

      if (!coupleSnap.exists()) {
        throw new Error('커플 정보를 찾을 수 없습니다');
      }

      const coupleData = coupleSnap.data();
      if (!coupleData.members.includes(myUid)) {
        throw new Error('권한이 없습니다');
      }
      if (coupleData.status === 'ended') {
        throw new Error('이미 종료된 관계입니다');
      }

      const now = new Date().toISOString();
      const [uid_a, uid_b] = coupleData.members;

      // 2. 커플 문서 종료
      transaction.update(coupleRef, {
        status: 'ended',
        endedAt: now,
        updatedAt: now,
      });

      // 3. 양쪽 유저 업데이트
      const userARef = doc(db, 'users', uid_a);
      const userBRef = doc(db, 'users', uid_b);
      const userASnap = await transaction.get(userARef);
      const userBSnap = await transaction.get(userBRef);

      if (userASnap.exists()) {
        const userAData = userASnap.data();
        const updatedHistory = (userAData.coupleHistory || []).map(h =>
          h.coupleId === coupleId ? { ...h, endedAt: now, status: 'ended' } : h
        );
        transaction.update(userARef, {
          activeCoupleId: null,
          coupleHistory: updatedHistory,
          updatedAt: now,
        });
      }

      if (userBSnap.exists()) {
        const userBData = userBSnap.data();
        const updatedHistory = (userBData.coupleHistory || []).map(h =>
          h.coupleId === coupleId ? { ...h, endedAt: now, status: 'ended' } : h
        );
        transaction.update(userBRef, {
          activeCoupleId: null,
          coupleHistory: updatedHistory,
          updatedAt: now,
        });
      }
    });

    return { error: null };
  } catch (error) {
    console.error('Dissolve pair error:', error);
    return { error: error.message };
  }
};

// 재연결 트랜잭션
// 새 커플 문서 생성 → 양쪽 유저 업데이트 (이전 세션 보존)
export const reconnectPair = async (myUid, partnerUid, previousCoupleId) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. 양쪽 유저 데이터 읽기
      const myRef = doc(db, 'users', myUid);
      const partnerRef = doc(db, 'users', partnerUid);
      const mySnap = await transaction.get(myRef);
      const partnerSnap = await transaction.get(partnerRef);

      if (!mySnap.exists() || !partnerSnap.exists()) {
        throw new Error('유저 정보를 찾을 수 없습니다');
      }

      const myData = mySnap.data();
      const partnerData = partnerSnap.data();

      if (myData.activeCoupleId) {
        throw new Error('이미 다른 짝꿍과 연결되어 있습니다');
      }
      if (partnerData.activeCoupleId) {
        throw new Error('상대방이 이미 다른 짝꿍과 연결되어 있습니다');
      }

      // 2. 새 커플 문서 생성
      const coupleId = `${myUid}_${partnerUid}_${Date.now()}`;
      const coupleRef = doc(db, 'couples', coupleId);
      const now = new Date().toISOString();

      const coupleData = {
        coupleId,
        members: [myUid, partnerUid],
        memberProfiles: {
          [myUid]: {
            displayName: myData.displayName || '',
            photoURL: myData.photoURL || null,
          },
          [partnerUid]: {
            displayName: partnerData.displayName || '',
            photoURL: partnerData.photoURL || null,
          },
        },
        status: 'active',
        sharedSurveys: {
          [myUid]: myData.survey || {},
          [partnerUid]: partnerData.survey || {},
        },
        sharedPreferences: {
          [myUid]: { likedWords: '', dislikedWords: '' },
          [partnerUid]: { likedWords: '', dislikedWords: '' },
        },
        previousCoupleId: previousCoupleId || null,
        createdAt: now,
        updatedAt: now,
        endedAt: null,
        version: 1,
      };

      transaction.set(coupleRef, coupleData);

      // 3. 양쪽 유저 업데이트
      const coupleHistoryEntry = {
        coupleId,
        startedAt: now,
        endedAt: null,
        status: 'active',
      };

      transaction.update(myRef, {
        activeCoupleId: coupleId,
        coupleHistory: [...(myData.coupleHistory || []), {
          ...coupleHistoryEntry,
          partnerUid,
        }],
        updatedAt: now,
      });

      transaction.update(partnerRef, {
        activeCoupleId: coupleId,
        coupleHistory: [...(partnerData.coupleHistory || []), {
          ...coupleHistoryEntry,
          partnerUid: myUid,
        }],
        updatedAt: now,
      });

      return { coupleId, coupleData };
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('Reconnect pair error:', error);
    return { data: null, error: error.message };
  }
};

// 커플 데이터 읽기
export const getCoupleData = async (coupleId) => {
  if (!db) return { data: null, error: 'Firebase 미초기화' };

  try {
    const coupleRef = doc(db, 'couples', coupleId);
    const coupleSnap = await getDoc(coupleRef);
    if (coupleSnap.exists()) {
      return { data: coupleSnap.data(), error: null };
    }
    return { data: null, error: '커플 정보를 찾을 수 없습니다' };
  } catch (error) {
    console.error('Get couple data error:', error);
    return { data: null, error: error.message };
  }
};

// 커플 상태 변경 (active ↔ paused)
export const updateCoupleStatus = async (coupleId, myUid, newStatus) => {
  if (!db) return { error: 'Firebase 미초기화' };

  if (!['active', 'paused'].includes(newStatus)) {
    return { error: '유효하지 않은 상태입니다' };
  }

  try {
    await runTransaction(db, async (transaction) => {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleSnap = await transaction.get(coupleRef);

      if (!coupleSnap.exists()) {
        throw new Error('커플 정보를 찾을 수 없습니다');
      }

      const coupleData = coupleSnap.data();
      if (!coupleData.members.includes(myUid)) {
        throw new Error('권한이 없습니다');
      }
      if (coupleData.status === 'ended') {
        throw new Error('종료된 관계는 변경할 수 없습니다');
      }

      transaction.update(coupleRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Update couple status error:', error);
    return { error: error.message };
  }
};

// 공유 선호도 업데이트
export const updateSharedPreferences = async (coupleId, uid, preferences) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    await runTransaction(db, async (transaction) => {
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleSnap = await transaction.get(coupleRef);

      if (!coupleSnap.exists()) {
        throw new Error('커플 정보를 찾을 수 없습니다');
      }

      const coupleData = coupleSnap.data();
      if (!coupleData.members.includes(uid)) {
        throw new Error('권한이 없습니다');
      }

      const updatedPrefs = { ...coupleData.sharedPreferences };
      updatedPrefs[uid] = { ...updatedPrefs[uid], ...preferences };

      transaction.update(coupleRef, {
        sharedPreferences: updatedPrefs,
        updatedAt: new Date().toISOString(),
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Update shared preferences error:', error);
    return { error: error.message };
  }
};
