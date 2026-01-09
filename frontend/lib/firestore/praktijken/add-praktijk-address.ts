import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

import { firestoreDb } from '../../../config/firebaseConfig'
import { PraktijkAddress } from '../../../schema/praktijk'

export type AddPraktijkAddressInput = {
  praktijkId: string
  name: string
  addressLine1?: string
  postalCode?: string
  city?: string
  phone?: string
  email?: string
  notes?: string
}

const addPraktijkAddress = async (input: AddPraktijkAddressInput): Promise<PraktijkAddress> => {
  const addressRef = await addDoc(collection(firestoreDb, 'praktijkAddresses'), {
    praktijkId: input.praktijkId,
    name: input.name,
    addressLine1: input.addressLine1 ?? '',
    postalCode: input.postalCode ?? '',
    city: input.city ?? '',
    phone: input.phone ?? '',
    email: input.email ?? '',
    notes: input.notes ?? '',
    createdAt: serverTimestamp(),
  })

  return {
    id: addressRef.id,
    praktijkId: input.praktijkId,
    name: input.name,
    addressLine1: input.addressLine1,
    postalCode: input.postalCode,
    city: input.city,
    phone: input.phone,
    email: input.email,
    notes: input.notes,
    createdAt: null,
  }
}

export default addPraktijkAddress
