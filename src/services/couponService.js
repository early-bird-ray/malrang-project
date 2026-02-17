import {
  db,
  doc,
  getDoc,
  runTransaction,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
} from './firebase';
import { spendGrapes } from './grapeService';

// 쿠폰 생성 (포도 구매 포함)
export const createCoupon = async (coupleId, uid, couponData, grapeCost = 0) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    // 포도 비용이 있으면 먼저 차감
    if (grapeCost > 0) {
      const { error: spendError } = await spendGrapes(
        uid, coupleId, grapeCost, 'coupon_purchase', { couponTitle: couponData.title }
      );
      if (spendError) return { error: spendError };
    }

    const couponRef = collection(db, 'couples', coupleId, 'coupons');
    const docRef = await addDoc(couponRef, {
      ...couponData,
      fromUid: uid,
      toUid: couponData.toUid || null,
      status: couponData.toUid ? 'sent' : 'draft',
      grapeCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Create coupon error:', error);
    return { id: null, error: error.message };
  }
};

// 쿠폰 전송 (draft → sent)
export const sendCoupon = async (coupleId, couponId, toUid) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    await runTransaction(db, async (transaction) => {
      const couponRef = doc(db, 'couples', coupleId, 'coupons', couponId);
      const couponSnap = await transaction.get(couponRef);

      if (!couponSnap.exists()) {
        throw new Error('쿠폰을 찾을 수 없습니다');
      }

      const couponData = couponSnap.data();
      if (couponData.status !== 'draft') {
        throw new Error('이미 전송된 쿠폰입니다');
      }

      transaction.update(couponRef, {
        toUid,
        status: 'sent',
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Send coupon error:', error);
    return { error: error.message };
  }
};

// 쿠폰 사용 (sent → used) - 트랜잭션으로 이중 사용 방지
export const useCoupon = async (coupleId, couponId, uid) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    await runTransaction(db, async (transaction) => {
      const couponRef = doc(db, 'couples', coupleId, 'coupons', couponId);
      const couponSnap = await transaction.get(couponRef);

      if (!couponSnap.exists()) {
        throw new Error('쿠폰을 찾을 수 없습니다');
      }

      const couponData = couponSnap.data();

      // toUid 본인만 사용 가능
      if (couponData.toUid !== uid) {
        throw new Error('이 쿠폰을 사용할 권한이 없습니다');
      }

      if (couponData.status === 'used') {
        throw new Error('이미 사용된 쿠폰입니다');
      }

      if (couponData.status !== 'sent') {
        throw new Error('사용할 수 없는 상태의 쿠폰입니다');
      }

      // 만료 확인
      if (couponData.expiry) {
        const expiryDate = new Date(couponData.expiry);
        if (expiryDate < new Date()) {
          throw new Error('만료된 쿠폰입니다');
        }
      }

      transaction.update(couponRef, {
        status: 'used',
        usedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Use coupon error:', error);
    return { error: error.message };
  }
};

// 쿠폰 사용 취소 (used → sent)
export const undoUseCoupon = async (coupleId, couponId, uid) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    await runTransaction(db, async (transaction) => {
      const couponRef = doc(db, 'couples', coupleId, 'coupons', couponId);
      const couponSnap = await transaction.get(couponRef);

      if (!couponSnap.exists()) {
        throw new Error('쿠폰을 찾을 수 없습니다');
      }

      const couponData = couponSnap.data();

      if (couponData.toUid !== uid) {
        throw new Error('권한이 없습니다');
      }

      if (couponData.status !== 'used') {
        throw new Error('사용 취소할 수 없는 상태입니다');
      }

      transaction.update(couponRef, {
        status: 'sent',
        usedAt: null,
        updatedAt: new Date().toISOString(),
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Undo use coupon error:', error);
    return { error: error.message };
  }
};

// 쿠폰 수정 (draft 상태만)
export const updateCoupon = async (coupleId, couponId, uid, updates) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    await runTransaction(db, async (transaction) => {
      const couponRef = doc(db, 'couples', coupleId, 'coupons', couponId);
      const couponSnap = await transaction.get(couponRef);

      if (!couponSnap.exists()) {
        throw new Error('쿠폰을 찾을 수 없습니다');
      }

      const couponData = couponSnap.data();
      if (couponData.fromUid !== uid) {
        throw new Error('권한이 없습니다');
      }
      if (couponData.status !== 'draft') {
        throw new Error('전송된 쿠폰은 수정할 수 없습니다');
      }

      transaction.update(couponRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Update coupon error:', error);
    return { error: error.message };
  }
};

// 쿠폰 삭제 (draft 상태만)
export const deleteCoupon = async (coupleId, couponId, uid) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const couponRef = doc(db, 'couples', coupleId, 'coupons', couponId);
    const couponSnap = await getDoc(couponRef);

    if (!couponSnap.exists()) {
      return { error: '쿠폰을 찾을 수 없습니다' };
    }

    const couponData = couponSnap.data();
    if (couponData.fromUid !== uid) {
      return { error: '권한이 없습니다' };
    }
    if (couponData.status !== 'draft') {
      return { error: '전송된 쿠폰은 삭제할 수 없습니다' };
    }

    await deleteDoc(couponRef);
    return { error: null };
  } catch (error) {
    console.error('Delete coupon error:', error);
    return { error: error.message };
  }
};

// 상점 쿠폰 등록
export const createShopListing = async (coupleId, uid, listingData) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const listingRef = collection(db, 'couples', coupleId, 'shopListings');
    const docRef = await addDoc(listingRef, {
      ...listingData,
      ownerUid: uid,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Create shop listing error:', error);
    return { id: null, error: error.message };
  }
};

// 상점 쿠폰 수정
export const updateShopListing = async (coupleId, listingId, updates) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const listingRef = doc(db, 'couples', coupleId, 'shopListings', listingId);
    await updateDoc(listingRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return { error: null };
  } catch (error) {
    console.error('Update shop listing error:', error);
    return { error: error.message };
  }
};

// 상점 쿠폰 삭제
export const deleteShopListing = async (coupleId, listingId) => {
  if (!db) return { error: 'Firebase 미초기화' };

  try {
    const listingRef = doc(db, 'couples', coupleId, 'shopListings', listingId);
    await deleteDoc(listingRef);
    return { error: null };
  } catch (error) {
    console.error('Delete shop listing error:', error);
    return { error: error.message };
  }
};
