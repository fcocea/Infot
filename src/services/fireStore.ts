import { Config, Log, areObjectsEqual } from '@/utils';

import { Grades, User } from '@/types';

import { initializeApp } from 'firebase/app';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

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

export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map((data) => data.data() as User);
  } catch (e) {
    Log('Error getting users from FireStore', 'error');
    return [];
  }
};

export const uploadGrades = async (
  userID: number,
  marks: Grades[],
): Promise<Omit<Grades, 'codigoAsignatura'>[]> => {
  const unnotifiedGrades: Omit<Grades, 'codigoAsignatura'>[] = [];
  for (const mark of marks) {
    const { codigoAsignatura, nombreAsignatura, ...partial } = mark;
    const partialMark = partial as Omit<
      Grades,
      'codigoAsignatura' | 'nombreAsignatura'
    >;
    const documentRef = doc(
      collection(db, `users/${userID}/subjects`),
      codigoAsignatura,
    );
    const documentSnapshot = await getDoc(documentRef);
    const notas = documentSnapshot.get('notas') as
      | Omit<Grades, 'codigoAsignatura' | 'nombreAsignatura'>[]
      | undefined;

    if (!notas) {
      await setDoc(documentRef, {
        codigoAsignatura,
        nombreAsignatura,
        notas: [partialMark],
      });
      unnotifiedGrades.push({
        ...partialMark,
        nombreAsignatura,
      } as Omit<Grades, 'codigoAsignatura'>);
      continue;
    }
    const exists = notas.some(
      (nota: Omit<Grades, 'codigoAsignatura' | 'nombreAsignatura'>) =>
        areObjectsEqual(nota, partialMark) ||
        (nota.nombre == 'NOTAFINAL' &&
          areObjectsEqual(
            { ...nota, fechaCreacion: undefined },
            { ...partialMark, fechaCreacion: undefined },
          )),
    );
    if (!exists) {
      await updateDoc(documentRef, {
        notas: arrayUnion(partialMark),
      });
      unnotifiedGrades.push({
        ...partialMark,
        nombreAsignatura,
      } as Omit<Grades, 'codigoAsignatura'>);
    }
  }
  return unnotifiedGrades;
};
