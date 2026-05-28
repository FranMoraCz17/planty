import { db } from "@/src/firebase/firebaseConfig";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import type { DiagnoseResult } from "./diagnoseService";

export interface DiagnoseRecord extends DiagnoseResult {
  id: string;
  plantId: string;
  plantName: string;
  photoUri?: string;
  createdAt: string;
}

type FirestoreRecord = Omit<DiagnoseRecord, "id">;

export async function saveDiagnose(
  plantId: string,
  plantName: string,
  result: DiagnoseResult,
  photoUri?: string,
): Promise<DiagnoseRecord> {
  const col = collection(db, "plants", plantId, "diagnoses");
  const data: FirestoreRecord = {
    ...result,
    plantId,
    plantName,
    photoUri,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(col, data);
  return { id: ref.id, ...data };
}

export async function getDiagnosesByPlant(
  plantId: string,
): Promise<DiagnoseRecord[]> {
  const col = collection(db, "plants", plantId, "diagnoses");
  const q = query(col, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as FirestoreRecord) }));
}
