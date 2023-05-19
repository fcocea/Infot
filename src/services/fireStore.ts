import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, doc, getDoc } from 'firebase/firestore';
import { Config, Log } from '@/utils';

const { FireStore } = Config;

const app = initializeApp(FireStore);
const db = getFirestore(app);

export const storeUser = async (
  userID: number,
  data: {
    username: string;
    token: string;
  },
): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', userID.toString()), {
      id: userID,
      ...data,
    });
    Log(`User ${userID} | ${data.username} stored in firestore`);
  } catch (e) {
    Log(
      `Error storing user ${userID} | ${data.username} in firestore`,
      'error',
    );
  }
};

export const loadUser = async (
  userID: number,
): Promise<{
  username?: string;
  token?: string;
}> => {
  const docRef = doc(db, 'users', userID.toString());
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      username: data.username,
      token: data.token,
    };
  }
  return {};
};
