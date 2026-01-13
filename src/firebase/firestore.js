import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// 컬렉션 이름
const COLUMNS_COLLECTION = 'columns';
const CARDS_COLLECTION = 'cards';

// 컬럼 관련 함수
export const getColumns = async () => {
  const columnsRef = collection(db, COLUMNS_COLLECTION);
  const q = query(columnsRef, orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToColumns = (callback, onError) => {
  const columnsRef = collection(db, COLUMNS_COLLECTION);
  const q = query(columnsRef, orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const columns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(columns);
    },
    (error) => {
      console.error('컬럼 구독 오류:', error);
      if (onError) onError(error);
    }
  );
};

export const addColumn = async (columnData) => {
  const columnsRef = collection(db, COLUMNS_COLLECTION);
  return await addDoc(columnsRef, columnData);
};

export const updateColumn = async (columnId, updates) => {
  const columnRef = doc(db, COLUMNS_COLLECTION, columnId);
  return await updateDoc(columnRef, updates);
};

export const deleteColumn = async (columnId) => {
  const columnRef = doc(db, COLUMNS_COLLECTION, columnId);
  return await deleteDoc(columnRef);
};

// 카드 관련 함수
export const getCards = async () => {
  const cardsRef = collection(db, CARDS_COLLECTION);
  const snapshot = await getDocs(cardsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToCards = (callback, onError) => {
  const cardsRef = collection(db, CARDS_COLLECTION);
  return onSnapshot(
    cardsRef,
    (snapshot) => {
      const cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(cards);
    },
    (error) => {
      console.error('카드 구독 오류:', error);
      if (onError) onError(error);
    }
  );
};

export const addCard = async (cardData) => {
  const cardsRef = collection(db, CARDS_COLLECTION);
  return await addDoc(cardsRef, cardData);
};

export const updateCard = async (cardId, updates) => {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  return await updateDoc(cardRef, updates);
};

export const deleteCard = async (cardId) => {
  const cardRef = doc(db, CARDS_COLLECTION, cardId);
  return await deleteDoc(cardRef);
};

// 여러 카드의 위치를 한 번에 업데이트 (드래그 앤 드롭 시 사용)
export const updateCardsOrder = async (updates) => {
  const batch = writeBatch(db);
  updates.forEach(({ cardId, updates: cardUpdates }) => {
    const cardRef = doc(db, CARDS_COLLECTION, cardId);
    batch.update(cardRef, cardUpdates);
  });
  return await batch.commit();
};
